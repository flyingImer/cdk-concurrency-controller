// TODO: migrate Construct for cdk v2
import * as path from 'path';
import { Construct, Duration, RemovalPolicy } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/aws-dynamodb';
import { Rule } from 'monocdk/aws-events';
import { SfnStateMachine } from 'monocdk/aws-events-targets';
import { Runtime } from 'monocdk/aws-lambda';
import { PythonFunction } from 'monocdk/aws-lambda-python';
import { LogGroup, RetentionDays } from 'monocdk/aws-logs';
import { Choice, Condition, Errors, IChainable, IntegrationPattern, IStateMachine, JsonPath, LogLevel, Map, Parallel, Pass, Result, StateMachine, Succeed, TaskInput, Wait, WaitTime } from 'monocdk/aws-stepfunctions';
import { DynamoAttributeValue, DynamoGetItem, DynamoProjectionExpression, DynamoPutItem, DynamoReturnValues, DynamoUpdateItem, LambdaInvoke, StepFunctionsStartExecution } from 'monocdk/aws-stepfunctions-tasks';

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
    const semaphore = new StateMachine(this, 'Semaphore', {
      definition: this.buildSemaphoreDefinition(locks, 'MySemaphore', 'currentlockcount', 5),
      tracingEnabled: true,
      logs: {
        destination: new LogGroup(this, 'SemaphoreLogGroup', {
          retention: RetentionDays.TWO_MONTHS,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        level: LogLevel.ALL,
      },
    });

    const semaphoreCleanup = new StateMachine(this, 'SemaphoreCleanup', {
      definition: this.buildCleanup(locks, 'MySemaphore', 'currentlockcount'),
      tracingEnabled: true,
      logs: {
        destination: new LogGroup(this, 'SemaphoreCleanupLogGroup', {
          retention: RetentionDays.TWO_MONTHS,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        level: LogLevel.ALL,
      },
    });

    new Rule(this, 'RunForIncomplete', {
      targets: [new SfnStateMachine(semaphoreCleanup)],
      eventPattern: {
        source: ['aws.states'],
        detail: {
          stateMachineArn: [semaphore.stateMachineArn],
          status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
        },
      },
    });

    new StateMachine(this, 'SemaphoreTesting', {
      definition: this.buildTesting(100, semaphore),
      tracingEnabled: true,
      logs: {
        destination: new LogGroup(this, 'SemaphoreTestingLogGroup', {
          retention: RetentionDays.TWO_MONTHS,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        level: LogLevel.ALL,
      },
    });
  }

  private buildSemaphoreDefinition(locks: Table, lockName: string, lockCountAttrName: string, concurrentAccessLimit: number): IChainable {
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
    });

    const continueBecauseLockWasAlreadyAcquired = new Pass(this, 'ContinueBecauseLockWasAlreadyAcquired', {
      comment: 'In this state, we have confimed that lock is already held, so we pass the original execution input into the the function that does the work.',
    });
    const waitToGetLock = new Wait(this, 'WaitToGetLock', {
      comment: 'If the lock indeed not been succesfully Acquired, then wait for a bit before trying again.',
      time: WaitTime.duration(Duration.seconds(3)),
    });

    const checkIfLockAlreadyAcquired = new Choice(this, 'CheckIfLockAlreadyAcquired', {
      comment: 'This state checks to see if the current execution already holds a lock. It can tell that by looking for Z, which will be indicative of the timestamp value. That will only be there in the stringified version of the data returned from DDB if this execution holds a lock.',
    });

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
    });

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
      }).addCatch(
        initializeLockItem.addCatch(acquireLock, { errors: [Errors.ALL] }).next(acquireLock),
        {
          errors: ['DynamoDB.AmazonDynamoDBException'],
          resultPath: '$.lockinfo.acquisitionerror',
        },
      ).addCatch(
        getCurrentLockRecord.next(
          checkIfLockAlreadyAcquired.when(
            Condition.and(
              Condition.isPresent('$.lockinfo.currentlockitem.ItemString'),
              Condition.stringMatches('$.lockinfo.currentlockitem.ItemString', '*Z*'),
            ),
            continueBecauseLockWasAlreadyAcquired,
          ).otherwise(
            waitToGetLock.next(acquireLock),
          ),
        ),
        {
          errors: ['DynamoDB.ConditionalCheckFailedException'],
          resultPath: '$.lockinfo.acquisitionerror',
        },
      ),
    );

    // do actual work
    const doWork = new LambdaInvoke(this, 'DoWork', {
      lambdaFunction: new PythonFunction(this, 'DoWorkLambda', {
        entry: path.join(__dirname, '..', 'example', 'lambda'),
        index: 'do_work_function/app.py',
        handler: 'lambda_handler',
        runtime: Runtime.PYTHON_3_8,
        timeout: Duration.seconds(60),
      }),
    });

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
    });

    return getLock
      .next(doWork)
      .next(
        releaseLock.addRetry({
          errors: ['DynamoDB.ConditionalCheckFailedException'],
          maxAttempts: 0,
        }).addRetry({
          errors: [Errors.ALL],
          maxAttempts: 5,
          backoffRate: 1.5,
        }).addCatch(successState, {
          errors: ['DynamoDB.ConditionalCheckFailedException'],
        }))
      .next(successState);
  }

  private buildCleanup(locks: Table, lockName: string, lockCountAttrName: string): IChainable {
    const getCurrentLockItem = new DynamoGetItem(this, 'GetCurrentLockItem', {
      comment: 'Get info from DDB for the lock item to look and see if this specific owner is still holding a lock',
      table: locks,
      key: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#lockownerid.$': '$.detail.executionArn',
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
    });

    const checkIfLockHeld = new Choice(this, 'CheckIfLockIsHeld', {
      comment: 'This state checks to see if the execution in question holds a lock. It can tell that by looking for Z, which will be indicative of the timestamp value. That will only be there in the stringified version of the data returned from DDB if this execution holds a lock',
    });

    const successState = new Succeed(this, 'SuccessStateCleanup'); // FIXME: correct the name
    const cleanUpLock = new DynamoUpdateItem(this, 'CleanUpLock', {
      comment: 'If this lockowerid is still there, then clean it up and release the lock',
      table: locks,
      key: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#currentlockcount': lockCountAttrName,
        '#lockownerid.$': '$.detail.executionArn',
      },
      expressionAttributeValues: {
        ':decrease': DynamoAttributeValue.fromNumber(1),
      },
      updateExpression: 'SET #currentlockcount = #currentlockcount - :decrease REMOVE #lockownerid',
      conditionExpression: 'attribute_exists(#lockownerid)',
      returnValues: DynamoReturnValues.UPDATED_NEW,
    });

    return getCurrentLockItem.addRetry({
      errors: [Errors.ALL],
      maxAttempts: 20,
      interval: Duration.seconds(5),
      backoffRate: 1.4,
    }).next(
      checkIfLockHeld.when(
        Condition.and(
          Condition.isPresent('$.lockinfo.currentlockitem.ItemString'),
          Condition.stringMatches('$.lockinfo.currentlockitem.ItemString', '*Z*'),
        ),
        cleanUpLock.addRetry({
          errors: ['DynamoDB.ConditionalCheckFailedException'],
          maxAttempts: 0,
        }).addRetry({
          errors: [Errors.ALL],
          maxAttempts: 20,
          interval: Duration.seconds(5),
          backoffRate: 1.4,
        }).addCatch(successState, {
          errors: ['DynamoDB.ConditionalCheckFailedException'],
        }).next(successState),
      ).otherwise(successState),
    );
  }

  private buildTesting(concurrentInputs: number, targetStateMachine: IStateMachine): IChainable {
    const generateDefaultInput = new Pass(this, 'GenerateDefaultInput', {
      parameters: {
        iterations: Array.from({ length: concurrentInputs }, (_, i) => i + 1),
      },
    });

    const startInParallel = new Map(this, 'StartInParallel', {
      maxConcurrency: 0,
      itemsPath: '$.iterations',
    });

    const runChildStateMachine = new StepFunctionsStartExecution(this, 'RunChildStateMachine', {
      stateMachine: targetStateMachine,
      integrationPattern: IntegrationPattern.RUN_JOB,
      input: TaskInput.fromObject({
        AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID: JsonPath.stringAt('$$.Execution.Id'),
      }),
      resultSelector: {
        Nothing: 'Nothing',
      },
    });

    const clearResults = new Pass(this, 'ClearResults', {
      result: Result.fromString('Done'),
    });

    return generateDefaultInput.next(
      startInParallel.iterator(
        runChildStateMachine.addRetry({
          errors: ['StepFunctions.ExecutionAlreadyExistsException'],
          maxAttempts: 1,
          interval: Duration.seconds(1),
          backoffRate: 5,
        }).addRetry({
          errors: [Errors.ALL],
          maxAttempts: 12,
          interval: Duration.seconds(1),
          backoffRate: 2,
        }).addCatch(clearResults, {
          errors: ['States.TaskFailed'],
          resultPath: '$.stateoutput.RunChildStateMachine',
        }).next(clearResults),
      ),
    );
  }
}