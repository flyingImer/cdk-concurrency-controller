import { Construct, Duration } from 'monocdk';
import { Attribute, AttributeType, ITable } from 'monocdk/aws-dynamodb';
import { Choice, Condition, Errors, IChainable, INextable, JsonPath, Pass, RetryProps, State, StateMachineFragment, Wait, WaitTime } from 'monocdk/aws-stepfunctions';
import { DynamoAttributeValue, DynamoGetItem, DynamoProjectionExpression, DynamoPutItem, DynamoReturnValues, DynamoUpdateItem } from 'monocdk/aws-stepfunctions-tasks';
import { isDeterminedNonNegativeInteger } from './private/utils';

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
  readonly limit: string;
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

export interface SemaphoreUseOptions extends SemaphoreUseDefinition { }

export interface AcquireSemaphoreOptions extends SemaphoreUseOptions {
  /**
   * Wait a fixed amount of time (in second) for another try to acquire semaphore if not acquired in previous tries.
   *
   * @default '3' seconds
   */
  readonly nextTryWaitTime?: string;
}

// eslint-disable-next-line max-len
export interface AcquireSemaphoreFragmentProps extends AcquireSemaphoreOptions, SemaphoreDefinition, SemaphorePersistenceContext, SemaphoreActionRetryOptions { }

export class AcquireSemaphoreFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: AcquireSemaphoreFragmentProps) {
    super(scope, id);

    const {
      semaphoreTable,
      name: semaphoreName,
      userId: semaphoreUserId,
      limit,
      nextTryWaitTime = Duration.seconds(3).toSeconds().toString(),
      retryStrategy = {
        interval: Duration.seconds(1),
        maxAttempts: 5,
        backoffRate: 1.5,
      },
    } = props;

    if (semaphoreTable.partitionKey.type !== AttributeType.STRING) {
      throw new Error('Partition key must be a string');
    }
    if (!JsonPath.isEncodedJsonPath(nextTryWaitTime) && !isDeterminedNonNegativeInteger(nextTryWaitTime)) {
      throw new Error('Next retry wait time literal string must be a positive integer value.');
    }

    const tryToAcquire = new DynamoUpdateItem(this, 'TryToAcquireSemaphore', {
      comment: 'Try to acquire a semaphore using a conditional update to DynamoDB. This update will do two things: 1) increment a counter for the number of held semaphores and 2) add an attribute to the DynamoDB Item with a unique key for this execution and with a value of the time when the semaphore was Acquired. The Update includes a conditional expression that will fail under two circumstances: 1) if the maximum number of semaphores have already been distributed or 2) if the current execution already owns a semaphore. The latter check is important to ensure the same execution doesn\'t increase the counter more than once. If either of these conditions are not met, then the task will fail with a DynamoDB.ConditionalCheckFailedException error, retry a few times, then if it is still not successful, it will move off to another branch of the workflow. If this is the first time that a given semaphoreName has been used, there will not be a row in DynamoDB, so the update will fail with DynamoDB.AmazonDynamoDBException. In that case, this state sends the workflow to state that will create that row to initialize.',
      table: semaphoreTable.table,
      key: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
      },
      expressionAttributeNames: {
        '#currentInUseCount': semaphoreTable.countAttributeName,
        '#semaphoreUserId': semaphoreUserId,
      },
      expressionAttributeValues: {
        ':increase': DynamoAttributeValue.fromNumber(1),
        ':limit': DynamoAttributeValue.numberFromString(limit), // this allow JsonPath expression to be used
        ':semaphoreUseAcquiredTime': DynamoAttributeValue.fromString(JsonPath.stringAt('$$.State.EnteredTime')),
      },
      updateExpression: 'SET #currentInUseCount = #currentInUseCount + :increase, #semaphoreUserId = :semaphoreUseAcquiredTime',
      conditionExpression: '#currentInUseCount <> :limit and attribute_not_exists(#semaphoreUserId)',
      returnValues: DynamoReturnValues.UPDATED_NEW,
      resultPath: JsonPath.DISCARD, // TODO: [p1] maybe replace with unified task status reporting format? <state_name>-<enter_time>-<message>
    });

    const initialize = new DynamoPutItem(this, 'InitializeSemaphore', {
      comment: `This state handles the case where an item hasn\'t been created for this semaphore yet. In that case, it will insert an initial item that includes the semaphore name as the key and ${semaphoreTable.countAttributeName} of 0. The Put to DynamoDB includes a conditional expression to fail if the an item with that key already exists, which avoids a race condition if multiple executions start at the same time. There are other reasons that the previous state could fail and end up here, so this is safe in those cases too.`,
      table: semaphoreTable.table,
      item: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
        [semaphoreTable.countAttributeName]: DynamoAttributeValue.fromNumber(0),
      },
      expressionAttributeValues: {
        ':semaphoreName': DynamoAttributeValue.fromString(semaphoreName),
      },
      conditionExpression: `${semaphoreTable.partitionKey.name} <> :semaphoreName`,
      resultPath: JsonPath.DISCARD,
    });

    const acquisitionConfirmedContinue = new Pass(this, 'SemaphoreAcquisitionConfirmedContinue', {
      comment: 'In this state, we have confirmed that semaphore is already held, so we pass the original execution input into the the function that does the work.',
      resultPath: JsonPath.DISCARD,
    });
    const waitToAcquire = new Wait(this, 'WaitToAcquireSemaphore', {
      comment: 'If the semaphore indeed not been successfully Acquired, then wait for a bit before trying again.',
      time: JsonPath.isEncodedJsonPath(nextTryWaitTime)
        ? WaitTime.secondsPath(nextTryWaitTime)
        : WaitTime.duration(Duration.seconds(parseInt(nextTryWaitTime))),
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
        resultPath: '$.semaphoreInfo.acquisitionError',
      },
    ).addCatch(
      new CheckIfSemaphoreUsedByUserFragment(this, 'CheckIfSemaphoreUsedByUser', {
        semaphoreUseResult: {
          outcomePath: '$.semaphoreInfo.currentSemaphoreUse',
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
        resultPath: '$.semaphoreInfo.acquisitionError',
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

export interface ReleaseSemaphoreFragmentProps extends ReleaseSemaphoreOptions, SemaphorePersistenceContext, SemaphoreActionRetryOptions { }

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
      comment: 'If this semaphoreUserId is still there, then clean it up and release the semaphore',
      table: semaphoreTable.table,
      key: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
      },
      expressionAttributeNames: {
        '#currentInUseCount': semaphoreTable.countAttributeName,
        '#semaphoreUserId': semaphoreUserId,
      },
      expressionAttributeValues: {
        ':decrease': DynamoAttributeValue.fromNumber(1),
      },
      updateExpression: 'SET #currentInUseCount = #currentInUseCount - :decrease REMOVE #semaphoreUserId',
      conditionExpression: 'attribute_exists(#semaphoreUserId)',
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
          outcomePath: '$.semaphoreInfo.currentSemaphoreUse',
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
      comment: 'Get info from DDB for the semaphore item.',
      table: semaphoreTable.table,
      key: {
        [semaphoreTable.partitionKey.name]: DynamoAttributeValue.fromString(semaphoreName),
      },
      expressionAttributeNames: {
        '#semaphoreUserId': semaphoreUserId,
      },
      projectionExpression: [
        new DynamoProjectionExpression().withAttribute('#semaphoreUserId'),
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
      comment: 'This state checks to see if the semaphore user already holds a semaphore. It can tell that by looking for Z, which will be indicative of the timestamp value. That will only be there in the stringified version of the data returned from DDB if this execution holds a semaphore.',
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