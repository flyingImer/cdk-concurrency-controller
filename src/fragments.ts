import { Construct } from 'constructs';
import { Duration } from 'monocdk';
import { Table } from 'monocdk/aws-dynamodb';
import { StateMachineFragment, State, INextable, JsonPath, Pass, Wait, WaitTime, Choice, Errors, Condition, RetryProps, IChainable, Succeed } from 'monocdk/aws-stepfunctions';
import { DynamoUpdateItem, DynamoAttributeValue, DynamoReturnValues, DynamoPutItem, DynamoGetItem, DynamoProjectionExpression } from 'monocdk/aws-stepfunctions-tasks';

export interface LockFragmentCommonProps {
  readonly locks: Table;
  readonly lockName: string;
  readonly lockCountAttrName: string;
  /**
   * @default - '$$.Execution.Id'
   */
  readonly lockOwnerId?: string;
}

export interface AcquireLockFragmentProps extends LockFragmentCommonProps {
  readonly concurrencyLimit: number;
}

export class AcquireLockFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: AcquireLockFragmentProps) {
    super(scope, id);

    const { locks, lockName, lockCountAttrName, lockOwnerId = '$$.Execution.Id', concurrencyLimit } = props;

    const acquireLock = new DynamoUpdateItem(this, 'AcquireLock', {
      comment: 'acquire a lock using a conditional update to DynamoDB. This update will do two things: 1) increment a counter for the number of held locks and 2) add an attribute to the DynamoDB Item with a unique key for this execution and with a value of the time when the lock was Acquired. The Update includes a conditional expression that will fail under two circumstances: 1) if the maximum number of locks have already been distributed or 2) if the current execution already owns a lock. The latter check is important to ensure the same execution doesn\'t increase the counter more than once. If either of these conditions are not met, then the task will fail with a DynamoDB.ConditionalCheckFailedException error, retry a few times, then if it is still not successful, it will move off to another branch of the workflow. If this is the first time that a given lockname has been used, there will not be a row in DynamoDB, so the update will fail with DynamoDB.AmazonDynamoDBException. In that case, this state sends the workflow to state that will create that row to initialize.',
      table: locks,
      key: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#currentlockcount': lockCountAttrName,
        '#lockownerid.$': lockOwnerId,
      },
      expressionAttributeValues: {
        ':increase': DynamoAttributeValue.fromNumber(1),
        ':limit': DynamoAttributeValue.fromNumber(concurrencyLimit),
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

    const lockAcquisitionConfirmedContinue = new Pass(this, 'LockAcquisitionConfirmedContinue', {
      comment: 'In this state, we have confimed that lock is already held, so we pass the original execution input into the the function that does the work.',
    });
    const waitToGetLock = new Wait(this, 'WaitToGetLock', {
      comment: 'If the lock indeed not been succesfully Acquired, then wait for a bit before trying again.',
      time: WaitTime.duration(Duration.seconds(3)),
    });

    const lockAcquired = new Pass(this, 'LockAcquired', {});

    const checkIfLockAlreadyAcquired = new CheckIfHoldingLockFragment(this, 'CheckIfLockIsHeld', {
      locks,
      lockName,
      lockOwnerId: lockOwnerId,
      ifHeldAction: lockAcquisitionConfirmedContinue.next(lockAcquired),
      ifNotHeldAction: waitToGetLock.next(acquireLock),
    });

    this.startState = acquireLock;
    this.endStates = acquireLock.addRetry({
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
      checkIfLockAlreadyAcquired,
      {
        errors: ['DynamoDB.ConditionalCheckFailedException'],
        resultPath: '$.lockinfo.acquisitionerror',
      },
    ).next(
      lockAcquired,
    ).endStates;
  }
}

export interface ReleaseLockFragmentProps extends LockFragmentCommonProps {
  /**
   * define how to handle Errors.ALL
   */
  readonly errorsAllRetryProps?: Omit<RetryProps, 'errors'>;
}

export class ReleaseLockFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: ReleaseLockFragmentProps) {
    super(scope, id);

    const { locks, lockName, lockCountAttrName, lockOwnerId = '$$.Execution.Id', errorsAllRetryProps } = props;

    const releaseLock = new DynamoUpdateItem(this, 'ReleaseLock', {
      comment: 'If this lockowerid is still there, then clean it up and release the lock',
      table: locks,
      key: {
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#currentlockcount': lockCountAttrName,
        '#lockownerid.$': lockOwnerId,
      },
      expressionAttributeValues: {
        ':decrease': DynamoAttributeValue.fromNumber(1),
      },
      updateExpression: 'SET #currentlockcount = #currentlockcount - :decrease REMOVE #lockownerid',
      conditionExpression: 'attribute_exists(#lockownerid)',
      returnValues: DynamoReturnValues.UPDATED_NEW,
    });
    const lockNotFoundContinue = new Pass(this, 'LockNotFoundContinue', {});
    const lockReleased = new Pass(this, 'LockReleased', {});

    this.startState = releaseLock;
    this.endStates = releaseLock.addRetry({
      errors: ['DynamoDB.ConditionalCheckFailedException'],
      maxAttempts: 0,
    }).addRetry({
      errors: [Errors.ALL],
      maxAttempts: 5,
      backoffRate: 1.5,
      ...errorsAllRetryProps,
    }).addCatch(
      lockNotFoundContinue.next(lockReleased),
      {
        errors: ['DynamoDB.ConditionalCheckFailedException'],
      },
    ).next(
      lockReleased,
    ).endStates;
  }
}

export interface CheckIfHoldingLockFragmentProps extends Omit<LockFragmentCommonProps, 'lockCountAttrName'> {
  readonly lockOwnerId: string;
  /**
   * @default - '$.lockinfo.currentlockitem'
   */
  readonly getLockResultPath?: string;
  /**
   * @default - no retry
   */
  readonly getLockErrorsHandling?: RetryProps[];
  readonly ifHeldAction: IChainable;
  /**
   * @default - if detected not held, an execution error will be raised.
   */
  readonly ifNotHeldAction?: IChainable;
}

export class CheckIfHoldingLockFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: CheckIfHoldingLockFragmentProps) {
    super(scope, id);

    const { locks, lockName, lockOwnerId, getLockResultPath, getLockErrorsHandling, ifHeldAction, ifNotHeldAction } = props;

    const getLockDetails = new DynamoGetItem(this, 'GetLockDetails', {
      comment: 'Get info from DDB for the lock item.',
      table: locks,
      key: {
        // TODO: dynamic lock name from state machine running context, e.g., input
        [locks.schema().partitionKey.name]: DynamoAttributeValue.fromString(lockName),
      },
      expressionAttributeNames: {
        '#lockownerid.$': lockOwnerId,
      },
      projectionExpression: [
        new DynamoProjectionExpression().withAttribute('#lockownerid'),
      ],
      resultSelector: {
        'Item.$': '$.Item',
        'ItemString.$': 'States.JsonToString($.Item)',
      },
      resultPath: getLockResultPath || '$.lockinfo.currentlockitem',
      consistentRead: true,
    });

    const checkIfLockHeld = new Choice(this, 'CheckIfLockIsHeld', {
      comment: 'This state checks to see if the locker owner already holds a lock. It can tell that by looking for Z, which will be indicative of the timestamp value. That will only be there in the stringified version of the data returned from DDB if this execution holds a lock.',
    }).when(
      Condition.and(
        Condition.isPresent('$.lockinfo.currentlockitem.ItemString'),
        Condition.stringMatches('$.lockinfo.currentlockitem.ItemString', '*Z*'),
      ),
      ifHeldAction,
    );
    if (ifNotHeldAction) {
      checkIfLockHeld.otherwise(ifNotHeldAction);
    };

    this.startState = getLockDetails;
    if (!!getLockErrorsHandling && getLockErrorsHandling.length > 0) {
      getLockErrorsHandling.forEach((retryProps) => getLockDetails.addRetry(retryProps));
    }
    this.endStates = getLockDetails.next(checkIfLockHeld).endStates;
  }
}

export interface CleanUpLockFragmentProps extends LockFragmentCommonProps {
  readonly lockOwnerId: string;
}

export class CleanUpLockFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: CleanUpLockFragmentProps) {
    super(scope, id);

    const { locks, lockName, lockCountAttrName, lockOwnerId } = props;

    const lockNotHeldContinue = new Succeed(this, 'LockNotHeldContinue');
    const cleanUpLock = new ReleaseLockFragment(this, 'CleanUpLock', {
      locks,
      lockName,
      lockCountAttrName,
      lockOwnerId,
      errorsAllRetryProps: {
        maxAttempts: 20,
        interval: Duration.seconds(5),
        backoffRate: 1.4,
      },
    });

    const checkIfHoldingLock = new CheckIfHoldingLockFragment(this, 'CheckIfHoldingLock', {
      locks,
      lockName,
      lockOwnerId,
      getLockErrorsHandling: [{
        errors: [Errors.ALL],
        maxAttempts: 20,
        interval: Duration.seconds(5),
        backoffRate: 1.4,
      }],
      ifHeldAction: cleanUpLock,
      ifNotHeldAction: lockNotHeldContinue,
    });
    this.startState = checkIfHoldingLock.startState;
    this.endStates = checkIfHoldingLock.endStates;
  }
}