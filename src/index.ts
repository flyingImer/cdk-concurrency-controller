// TODO: migrate Construct for cdk v2
import { Construct, Duration } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/aws-dynamodb';
import { Choice, Condition, Errors, IChainable, JsonPath, Parallel, Pass, StateMachine, Succeed, Wait, WaitTime } from 'monocdk/aws-stepfunctions';
import { DynamoAttributeValue, DynamoGetItem, DynamoProjectionExpression, DynamoPutItem, DynamoReturnValues, DynamoUpdateItem } from 'monocdk/aws-stepfunctions-tasks';

export class DistributedSemaphore extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const locks = new Table(this, 'LockTable', {
      partitionKey: {
        name: 'LockName',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // TODO: maybe expose via StateMachineFragment?
    new StateMachine(this, 'Semaphore', {
      definition: this.buildSemaphoreDefinition(locks, 'MySemaphore', 5),
    });
  }

  private buildSemaphoreDefinition(locks: Table, lockName: string, concurrentAccessLimit: number): IChainable {
    const lockCountAttrName = 'currentlockcount';

    // get lock
    const acquireLock = new DynamoUpdateItem(this, 'AcquireLock', {
      comment: 'acquire a lock using a conditional update to DynamoDB. This update will do two things: 1) increment a counter for the number of held locks and 2) add an attribute to the DynamoDB Item with a unique key for this execution and with a value of the time when the lock was Acquired. The Update includes a conditional expression that will fail under two circumstances: 1) if the maximum number of locks have already been distributed or 2) if the current execution already owns a lock. The latter check is important to ensure the same execution doesn\'t increase the counter more than once. If either of these conditions are not met, then the task will fail with a DynamoDB.ConditionalCheckFailedException error, retry a few times, then if it is still not successful, it will move off to another branch of the workflow. If this is the first time that a given lockname has been used, there will not be a row in DynamoDB, so the update will fail with DynamoDB.AmazonDynamoDBException. In that case, this state sends the workflow to state that will create that row to initialize.',
      table: locks,
      key: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#currentlockcount': lockCountAttrName,
        '#lockownerid.$': '$$.Execution.Id',
      },
      expressionAttributeValues: {
        ':increase': DynamoAttributeValue.fromNumber(1),
        ':limit': DynamoAttributeValue.fromNumber(concurrentAccessLimit),
        ':lockacquiredtime': DynamoAttributeValue.fromString(JsonPath.stringAt('$$.State.EnteredTime')),
      },
      updateExpression: 'SET #currentlockcount = #currentlockcount + :increase, #lockownerid = :lockacquiredtime',
      conditionExpression: 'currentlockcount <> :limit and attribute_not_exists(#lockownerid)', // TODO: should currentlockcount to be #currentlockcount?
      returnValues: DynamoReturnValues.UPDATED_NEW,
    });

    const initializeLockItem = new DynamoPutItem(this, 'InitializeLockItem', {
      comment: 'This state handles the case where an item hasn\'t been created for this lock yet. In that case, it will insert an initial item that includes the lock name as the key and currentlockcount of 0. The Put to DynamoDB includes a conditonal expression to fail if the an item with that key already exists, which avoids a race condition if multiple executions start at the same time. There are other reasons that the previous state could fail and end up here, so this is safe in those cases too.',
      table: locks,
      item: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
        [lockCountAttrName]: DynamoAttributeValue.fromNumber(0),
      },
      expressionAttributeValues: {
        ':lockname': DynamoAttributeValue.fromString(lockName),
      },
      conditionExpression: `${locks.schema().partitionKey.name} <> :lockname`,
    }).addCatch(acquireLock, {
      errors: [Errors.ALL],
    }).next(acquireLock);

    const continueBecauseLockWasAlreadyAcquired = new Pass(this, 'ContinueBecauseLockWasAlreadyAcquired', {
      comment: 'In this state, we have confimed that lock is already held, so we pass the original execution input into the the function that does the work.',
    });
    const waitToGetLock = new Wait(this, 'WaitToGetLock', {
      comment: 'If the lock indeed not been succesfully Acquired, then wait for a bit before trying again.',
      time: WaitTime.duration(Duration.seconds(3)),
    }).next(acquireLock);

    const checkIfLockAlreadyAcquired = new Choice(this, 'CheckIfLockAlreadyAcquired', {
      comment: 'This state checks to see if the current execution already holds a lock. It can tell that by looking for Z, which will be indicative of the timestamp value. That will only be there in the stringified version of the data returned from DDB if this execution holds a lock.',
    }).when(
      Condition.and(
        Condition.isPresent('$.lockinfo.currentlockitem.ItemString'),
        Condition.stringMatches('$.lockinfo.currentlockitem.ItemString', '*Z*'),
      ),
      continueBecauseLockWasAlreadyAcquired,
    ).otherwise(waitToGetLock);

    const getCurrentLockRecord = new DynamoGetItem(this, 'GetCurrentLockRecord', {
      comment: 'This state is called when the execution is unable to acquire a lock because there limit has either been exceeded or because this execution already holds a lock. I that case, this task loads info from DDB for the current lock item so that the right decision can be made in subsequent states.',
      table: locks,
      key: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#lockownerid.$': '$$.Execution.Id', // TODO: JsonPath.stringAt?
      },
      projectionExpression: [
        new DynamoProjectionExpression().withAttribute('#lockownerid'),
      ],
      resultSelector: {
        'Item.$': '$.Item',
        'ItemString.$': 'States.JsonToString($.Item)',
      },
      resultPath: '$.lockinfo.currentlockitem',
      consistentRead: true,
    }).next(checkIfLockAlreadyAcquired);

    const getLock = new Parallel(this, 'GetLock', {
      comment: 'This parallel state contains the logic to acquire a lock and to handle the cases where a lock cannot be Acquired. Containing this in a parallel allows for visual separation when viewing the state machine and makes it easier to reuse this same logic elsewhere if desired. Because this state sets ResultPath: null, it will not manipulate the execution input that is passed on to the subsequent part of your state machine that is responsible for doing the work.',
    }).branch(
      acquireLock.addRetry({
        errors: ['DynamoDB.AmazonDynamoDBException'],
        maxAttempts: 0,
      }).addRetry({
        errors: [Errors.ALL],
        maxAttempts: 6,
        backoffRate: 2,
      }).addCatch(initializeLockItem, {
        errors: ['DynamoDB.AmazonDynamoDBException'],
        resultPath: '$.lockinfo.acquisitionerror',
      }).addCatch(getCurrentLockRecord, {
        errors: ['DynamoDB.ConditionalCheckFailedException'],
        resultPath: '$.lockinfo.acquisitionerror',
      }),
    );

    // do actual work
    const doWork = new Parallel(this, 'DoWork', {
      comment: 'This is a placeholder for the actual logic of your workflow. By wrapping this in a parallel state, you should be able to paste in any statemachine defined elsewhere. In this case, to illustrate the behavior, this one will run through some pass states and then call a Lambda function that will sleep for a period before it returns.',
    }).branch(
      new Pass(this, 'Pass1', {}),
    );

    // end state
    const successState = new Succeed(this, 'SuccessState');

    // release lock
    const releaseLock = new DynamoUpdateItem(this, 'ReleaseLock', {
      table: locks,
      key: {
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#currentlockcount': lockCountAttrName,
        '#lockownerid.$': '$$.Execution.Id',
      },
      expressionAttributeValues: {
        ':decrease': DynamoAttributeValue.fromNumber(1),
      },
      updateExpression: 'SET #currentlockcount = #currentlockcount - :decrease REMOVE #lockownerid',
      conditionExpression: 'attribute_exists(#lockownerid)',
      returnValues: DynamoReturnValues.UPDATED_NEW,
    }).addRetry({
      errors: ['DynamoDB.ConditionalCheckFailedException'],
      maxAttempts: 0,
    }).addRetry({
      errors: [Errors.ALL],
      maxAttempts: 5,
      backoffRate: 1.5,
    }).addCatch(
      successState, {
        errors: ['DynamoDB.ConditionalCheckFailedException'],
      });
    return getLock.next(doWork).next(releaseLock).next(successState);
  }
}