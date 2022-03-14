import { Construct, Duration } from 'monocdk';
import { Attribute, AttributeType, ITable } from 'monocdk/aws-dynamodb';
import { Choice, Condition, Errors, IChainable, INextable, JsonPath, Pass, RetryProps, State, StateMachineFragment, Wait, WaitTime } from 'monocdk/aws-stepfunctions';
import { DynamoAttributeValue, DynamoGetItem, DynamoProjectionExpression, DynamoPutItem, DynamoReturnValues, DynamoUpdateItem } from 'monocdk/aws-stepfunctions-tasks';

export interface SemaphoreTableDefinition {
  readonly table: ITable;
  readonly partitionKey: Attribute;
  /**
   * The attribute name for a semaphore in-use count.
   */
  readonly countAttributeName: string;
}

interface SemaphoreName {
  /**
   * The name for the semaphore. Or it can be JsonPath expression that extracts the value from the state object at runtime.
   * This allows custom semaphore names from runtime input for multiple resources.
   *
   * Example value: `$.semaphoreName`
   */
  readonly name: string;
}

export interface SemaphoreDefinition extends SemaphoreName {
  /**
   * The value for concurrency control.
   */
  // TODO: make it optional? to allow some default value unless otherwise overridden here.
  readonly concurrencyLimit: number;
}

interface SemaphorePersistenceContext {
  /**
   * The DynamoDB table to use for the semaphore.
   */
  readonly semaphoreTable: SemaphoreTableDefinition;
}

interface SemaphoreUseDefinition extends SemaphoreName {
  /**
    * The semaphore user id to acquire/release resource usage.
    */
  readonly userId: string;
}

interface SemaphoreActionRetryOptions {
  /**
   * Retry strategy on Errors.ALL when releasing a semaphore use from the semaphore table.
   *
   * NOTE: `errors` property is always overridden to [Errors.ALL].
   *
   * @default '{ interval: Duration.seconds(1), maxAttempts: 5, backoffRate: 1.5 }'
   */
  readonly retryStrategy?: RetryProps;
}

export interface SemaphoreUseOptions extends SemaphoreUseDefinition, SemaphoreActionRetryOptions { }

export interface AcquireSemaphoreOptions extends SemaphoreUseOptions {
  /**
   * The maximum wait duration for another try to acquire semaphore if not acquired in previous tries.
   *
   * @default Duration.seconds(3)
   */
  readonly waitTime?: WaitTime;
}

export interface AcquireSemaphoreFragmentProps extends AcquireSemaphoreOptions, SemaphoreDefinition, SemaphorePersistenceContext { }

export class AcquireSemaphoreFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: AcquireSemaphoreFragmentProps) {
    super(scope, id);

    const {
      semaphoreTable,
      name: semaphoreName,
      userId: semaphoreUserId,
      concurrencyLimit,
      waitTime = WaitTime.duration(Duration.seconds(3)),
      retryStrategy = {
        interval: Duration.seconds(1),
        maxAttempts: 5,
        backoffRate: 1.5,
      },
    } = props;

    if (semaphoreTable.partitionKey.type !== AttributeType.STRING) {
      throw new Error('Partition key must be a string');
    }

    const tryToAcquire = new DynamoUpdateItem(this, 'TryToAcquireSemaphore', {
      comment: 'acquire a lock using a conditional update to DynamoDB. This update will do two things: 1) increment a counter for the number of held locks and 2) add an attribute to the DynamoDB Item with a unique key for this execution and with a value of the time when the lock was Acquired. The Update includes a conditional expression that will fail under two circumstances: 1) if the maximum number of locks have already been distributed or 2) if the current execution already owns a lock. The latter check is important to ensure the same execution doesn\'t increase the counter more than once. If either of these conditions are not met, then the task will fail with a DynamoDB.ConditionalCheckFailedException error, retry a few times, then if it is still not successful, it will move off to another branch of the workflow. If this is the first time that a given lockname has been used, there will not be a row in DynamoDB, so the update will fail with DynamoDB.AmazonDynamoDBException. In that case, this state sends the workflow to state that will create that row to initialize.',
      table: semaphoreTable.table,
      key: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
      },
      expressionAttributeNames: {
        '#currentlockcount': semaphoreTable.countAttributeName,
        '#lockownerid.$': semaphoreUserId, // TODO: remove '.$' to allow JsonPath expressions?
      },
      expressionAttributeValues: {
        ':increase': DynamoAttributeValue.fromNumber(1),
        ':limit': DynamoAttributeValue.fromNumber(concurrencyLimit),
        ':lockacquiredtime': DynamoAttributeValue.fromString(JsonPath.stringAt('$$.State.EnteredTime')),
      },
      updateExpression: 'SET #currentlockcount = #currentlockcount + :increase, #lockownerid = :lockacquiredtime',
      conditionExpression: '#currentlockcount <> :limit and attribute_not_exists(#lockownerid)',
      returnValues: DynamoReturnValues.UPDATED_NEW,
      resultPath: JsonPath.DISCARD, // TODO: [p1] maybe replace with unified task status reporting format? <state_name>-<enter_time>-<message>
    });

    const initialize = new DynamoPutItem(this, 'InitializeSemaphore', {
      comment: 'This state handles the case where an item hasn\'t been created for this lock yet. In that case, it will insert an initial item that includes the lock name as the key and currentlockcount of 0. The Put to DynamoDB includes a conditonal expression to fail if the an item with that key already exists, which avoids a race condition if multiple executions start at the same time. There are other reasons that the previous state could fail and end up here, so this is safe in those cases too.',
      table: semaphoreTable.table,
      item: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
        [semaphoreTable.countAttributeName]: DynamoAttributeValue.fromNumber(0),
      },
      expressionAttributeValues: {
        ':lockname': DynamoAttributeValue.fromString(semaphoreName),
      },
      conditionExpression: `${semaphoreTable.partitionKey.name} <> :lockname`,
      resultPath: JsonPath.DISCARD,
    });

    const acquisitionConfirmedContinue = new Pass(this, 'SemaphoreAcquisitionConfirmedContinue', {
      comment: 'In this state, we have confimed that lock is already held, so we pass the original execution input into the the function that does the work.',
      resultPath: JsonPath.DISCARD,
    });
    const waitToAcquire = new Wait(this, 'WaitToAcquireSemaphore', {
      comment: 'If the lock indeed not been succesfully Acquired, then wait for a bit before trying again.',
      time: waitTime,
    });

    const acquired = new Pass(this, 'SemaphoreAcquired', {
      resultPath: JsonPath.DISCARD,
    });

    // TODO: [p1] wrap input to clean up for internal usages
    this.startState = tryToAcquire;
    this.endStates = tryToAcquire.addRetry({
      errors: ['DynamoDB.AmazonDynamoDBException'],
      maxAttempts: 0,
    }).addRetry({
      ...retryStrategy,
      errors: [Errors.ALL],
    }).addCatch(
      initialize.addCatch(tryToAcquire, { errors: [Errors.ALL], resultPath: JsonPath.DISCARD }).next(tryToAcquire),
      {
        errors: ['DynamoDB.AmazonDynamoDBException'],
        resultPath: '$.lockinfo.acquisitionerror', // FIXME:
      },
    ).addCatch(
      new CheckIfSemaphoreUsedByUserFragment(this, 'CheckIfSemaphoreUsedByUser', {
        semaphoreUseResult: {
          outcomePath: '$.lockinfo.currentlockitem', // FIXME:
          foundAction: acquisitionConfirmedContinue.next(acquired),
          notFoundAction: waitToAcquire.next(tryToAcquire), // TODO: starving?
        },
        ...props,
        retryStrategy: {
          interval: Duration.seconds(1),
          maxAttempts: 3,
          backoffRate: 2,
        },
      }),
      {
        errors: ['DynamoDB.ConditionalCheckFailedException'],
        resultPath: '$.lockinfo.acquisitionerror', // FIXME:
      },
    ).next(
      acquired,
    ).endStates;
  }
}

export interface ReleaseSemaphoreOptions extends SemaphoreUseOptions {
  /**
   * Check if the semaphore use exists before trying to release it.
   * This can help to shift the load from write capacity to read capacity in case of missing semaphore use
   * (best effort to avoid hot partitions and save write capacity for crucial actions),
   * where DDB provides 3x throughput on read capacity than write capacity per partition.
   * see more about hot partition: https://aws.amazon.com/premiumsupport/knowledge-center/dynamodb-table-throttled/#You_have_a_hot_partition_in_your_table
   * @default false
   */
  readonly checkSemaphoreUseFirst?: boolean;
}

export interface ReleaseSemaphoreFragmentProps extends ReleaseSemaphoreOptions, SemaphorePersistenceContext { }

export class ReleaseSemaphoreFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: ReleaseSemaphoreFragmentProps) {
    super(scope, id);

    const {
      semaphoreTable,
      name: semaphoreName,
      checkSemaphoreUseFirst = false,
      userId: semaphoreUserId,
      retryStrategy = {
        interval: Duration.seconds(1),
        maxAttempts: 5,
        backoffRate: 1.5,
      },
    } = props;

    const tryToRelease = new DynamoUpdateItem(this, 'TryToReleaseSemaphore', {
      comment: 'If this lockowerid is still there, then clean it up and release the lock',
      table: semaphoreTable.table,
      key: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
      },
      expressionAttributeNames: {
        '#currentlockcount': semaphoreTable.countAttributeName,
        '#lockownerid.$': semaphoreUserId,
      },
      expressionAttributeValues: {
        ':decrease': DynamoAttributeValue.fromNumber(1),
      },
      updateExpression: 'SET #currentlockcount = #currentlockcount - :decrease REMOVE #lockownerid',
      conditionExpression: 'attribute_exists(#lockownerid)',
      returnValues: DynamoReturnValues.UPDATED_NEW,
      resultPath: JsonPath.DISCARD,
    });
    const notFoundContinue = new Pass(this, 'SemaphoreUseNotFoundContinue', {
      resultPath: JsonPath.DISCARD,
    });
    const released = new Pass(this, 'SemaphoreReleased', {
      resultPath: JsonPath.DISCARD,
    });

    const notFoundChain = notFoundContinue.next(released);
    const releaseChain = tryToRelease.addRetry({
      errors: ['DynamoDB.ConditionalCheckFailedException'],
      maxAttempts: 0,
    }).addRetry({
      ...retryStrategy,
      errors: [Errors.ALL],
    }).addCatch(
      notFoundChain,
      {
        errors: ['DynamoDB.ConditionalCheckFailedException'],
        resultPath: JsonPath.DISCARD,
      },
    ).next(
      released,
    );

    if (!checkSemaphoreUseFirst) {
      this.startState = tryToRelease;
      this.endStates = releaseChain.endStates;
    } else {
      const checkSemaphoreUse = new CheckIfSemaphoreUsedByUserFragment(this, 'CheckIfSemaphoreUsedByUser', {
        semaphoreUseResult: {
          outcomePath: '$.lockinfo.currentlockitem', // FIXME:
          foundAction: releaseChain,
          notFoundAction: notFoundChain,
        },
        ...props,
        retryStrategy: {
          interval: Duration.seconds(1),
          maxAttempts: 3,
          backoffRate: 2,
        },
      });
      this.startState = checkSemaphoreUse.startState;
      this.endStates = checkSemaphoreUse.endStates;
    }
  }
}

interface CheckIfSemaphoreUsedByUserFragmentProps extends SemaphorePersistenceContext, SemaphoreUseDefinition, SemaphoreActionRetryOptions {
  readonly semaphoreUseResult: {
    /**
     * Path in the state object to store the check result.
     */
    readonly outcomePath: string;
    /**
     * Chainable action when found the semaphore use.
     */
    readonly foundAction: IChainable;
    /**
     * Chainable action when not found the semaphore use.
     */
    readonly notFoundAction: IChainable;
  };
}

class CheckIfSemaphoreUsedByUserFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: CheckIfSemaphoreUsedByUserFragmentProps) {
    super(scope, id);

    const {
      semaphoreTable,
      name: semaphoreName,
      userId: semaphoreUserId,
      semaphoreUseResult: { outcomePath, foundAction, notFoundAction },
      retryStrategy = {
        interval: Duration.seconds(1),
        maxAttempts: 5,
        backoffRate: 1.5,
      },
    } = props;

    // TODO: double check if input is persisted
    const itemObjectKey = 'Item';
    const itemStringKey = 'ItemString';
    const itemObjectPath = `${outcomePath}.${itemObjectKey}`;
    const itemStringPath = `${outcomePath}.${itemStringKey}`;

    const getSemaphoreUse = new DynamoGetItem(this, 'GetSemaphoreUse', {
      comment: 'Get info from DDB for the lock item.',
      table: semaphoreTable.table,
      key: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
      },
      expressionAttributeNames: {
        '#lockownerid.$': semaphoreUserId,
      },
      projectionExpression: [
        new DynamoProjectionExpression().withAttribute('#lockownerid'),
      ],
      resultPath: outcomePath,
      consistentRead: true,
    });

    const CheckIfFoundSemaphore = new Choice(this, 'CheckIfFoundSemaphore');

    const prepareInput = new Pass(this, 'PrepareInput', {
      parameters: {
        Item: JsonPath.objectAt(itemObjectPath),
        [itemStringKey]: JsonPath.jsonToString(JsonPath.objectAt(itemObjectPath)),
      },
      resultPath: outcomePath,
    });

    const checkIfFoundSemaphoreUse = new Choice(this, 'CheckIfFoundSemaphoreUse', {
      comment: 'This state checks to see if the locker owner already holds a lock. It can tell that by looking for Z, which will be indicative of the timestamp value. That will only be there in the stringified version of the data returned from DDB if this execution holds a lock.',
    });

    this.startState = getSemaphoreUse;
    this.endStates = getSemaphoreUse.addRetry({
      errors: [Errors.ALL],
      ...retryStrategy,
    }).next(
      CheckIfFoundSemaphore.when(
        Condition.isPresent(itemObjectPath),
        prepareInput.next(
          checkIfFoundSemaphoreUse.when(
            Condition.and(
              Condition.isPresent(itemStringPath),
              Condition.stringMatches(itemStringPath, '*Z*'),
            ),
            foundAction,
          ).otherwise(
            notFoundAction,
          ),
        ),
      ).otherwise(
        notFoundAction,
      ),
    ).endStates;
  }
}