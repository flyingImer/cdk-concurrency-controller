import { RemovalPolicy } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IChainable, IStateMachine, JsonPath, LogLevel, Map, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { DistributedSemaphore, DistributedSemaphoreProps } from './semaphore';

/**
 * @experimental
 */
export interface ExperimentalDistributedSemaphoreProps extends DistributedSemaphoreProps {
  /**
   * @default true
   */
  readonly enableAutoCleanup?: boolean;
}

/**
 * @experimental
 */
export class ExperimentalDistributedSemaphore extends DistributedSemaphore {
  private listenerCount = 0;
  private readonly expStateMachine: IStateMachine;
  constructor(scope: Construct, id: string, props: ExperimentalDistributedSemaphoreProps = {}) {
    super(scope, id, convertSemaphoreProps(scope, props));
    // TODO: make it better

    this.expStateMachine = new StateMachine(this, 'ExperimentalStateMachine', {
      definition: this.__buildExpDefinition('Exp'),
      ...this.cleanupSemaphoreStateMachineProps,
    });
  }

  /**
   * @experimental
   * By registering a state machine that directly uses this distributed semaphore,
   * this distributed semaphore will be able to clean up the semaphore use on execution failures
   * of registered state machines.
   *
   * NOTE: This relies on CloudWatch logs to locate failed executions of registered state machines.
   * It will add CloudWatch logging if not configured.
   *
   * @param semaphoreUserStateMachine the state machine that uses this distributed semaphore
   */
  public listen(semaphoreUserStateMachine: IStateMachine): void {
    // TODO: give a better name
    new Rule(this, `RunForIncomplete${this.listenerCount++}`, {
      targets: [new SfnStateMachine(this.expStateMachine)],
      eventPattern: {
        source: ['aws.states'],
        detail: {
          stateMachineArn: [
            semaphoreUserStateMachine.stateMachineArn,
          ],
          status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
        },
      },
    });
  }

  /**
   * @internal
   */
  __buildExpDefinition(disambiguator = ''): IChainable {
    return new CallAwsService(this, `LocateFailedExecutions${disambiguator}`, {
      service: 'cloudwatchlogs',
      action: 'startQuery',
      parameters: {
        // FIXME: go back up to 25 hours
        StartTime: JsonPath.stringAt('$$.Execution.StartTime'),
        EndTime: JsonPath.stringAt('$$.Execution.StartTime'),
        QueryString: `fields details.input, @timestamp, @message, @logStream
                      | filter id = '1'
                      | parse details.input /\"AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID\":\"(?<semaphoreUseExecutionArn>.*?)\"/
                      | parse details.input /\"name\":\"(?<semaphoreName>.*?)\"/
                      | parse details.input /\"userId\":\"(?<semaphoreUserId>.*?)\"/
                      | filter semaphoreUseExecutionArn = '"$$.Execution.Input.detail.executionArn"'
                      | display semaphoreUseExecutionArn, semaphoreName, semaphoreUserId`,
      },
      iamResources: [this.acquireSemaphoreStateMachineProps!.logs!.destination.logGroupArn],
      // TODO: add result selection
    }).next(
      new Map(this, `MapToCleanups${disambiguator}`, {
        // TODO: allow max concurrency control via props?
        itemsPath: JsonPath.stringAt('$.logEvents[*].message'),
      }).iterator(this.__buildCleanupDefinition(disambiguator)),
    );
  }
}

/**
 * Overrides AcquireSemaphoreStateMachine logs props if not set.
 */
const convertSemaphoreProps = (scope: Construct, props: ExperimentalDistributedSemaphoreProps): DistributedSemaphoreProps => {
  const { enableAutoCleanup = true, acquireSemaphoreStateMachineProps = {} } = props;
  if (!enableAutoCleanup) return props;
  return {
    ...props,
    acquireSemaphoreStateMachineProps: {
      ...props,
      logs: {
        destination: acquireSemaphoreStateMachineProps.logs?.destination || new LogGroup(scope, 'AcquireSemaphoreLogGroup', {
          retention: RetentionDays.TWO_MONTHS,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        // TODO: revisit if this is the right level
        level: LogLevel.ALL,
      },
    },
  };
};