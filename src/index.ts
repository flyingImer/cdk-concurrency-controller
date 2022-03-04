// TODO: migrate Construct for cdk v2
import { Construct, Duration, RemovalPolicy } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/aws-dynamodb';
import { Rule } from 'monocdk/aws-events';
import { SfnStateMachine } from 'monocdk/aws-events-targets';
import { LogGroup, RetentionDays } from 'monocdk/aws-logs';
import { Choice, Condition, Errors, IChainable, IntegrationPattern, IStateMachine, JsonPath, LogLevel, Map, Pass, Result, StateMachine, Succeed, TaskInput } from 'monocdk/aws-stepfunctions';
import { DynamoAttributeValue, DynamoGetItem, DynamoProjectionExpression, DynamoReturnValues, DynamoUpdateItem, StepFunctionsStartExecution } from 'monocdk/aws-stepfunctions-tasks';
import { AcquireLockFragment, ReleaseLockFragment } from './fragments';

export interface DistributedSemaphoreProps {
  readonly doWork: IChainable;
}
export class DistributedSemaphore extends Construct {
  private readonly doWork: IChainable;
  constructor(scope: Construct, id: string, props: DistributedSemaphoreProps) {
    super(scope, id);
    this.doWork = props.doWork;
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

  private buildSemaphoreDefinition(locks: Table, lockName: string, lockCountAttrName: string, concurrencyLimit: number): IChainable {
    const commonProps = {
      locks,
      lockName,
      lockCountAttrName,
    };
    return new AcquireLockFragment(this, 'AcquireMyLock', { ...commonProps, concurrencyLimit }).toSingleState()
      .next(this.doWork)
      .next(new ReleaseLockFragment(this, 'ReleaseMyLock', { ...commonProps }).toSingleState());
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