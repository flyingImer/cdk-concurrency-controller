import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IChainable, IStateMachine, JsonPath, LogLevel, Map, Pass, StateMachine, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { CallAwsService, EvaluateExpression } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { ReleaseViaStartExecutionFragment } from './fragments';
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
    const inputStartTimePath = '$.detail.startDate';
    const inputEndTimePath = '$.detail.stopDate';
    const contextPathPrefix = '$.Context';
    const queryStartTimeSubPath = `${contextPathPrefix}.StartQueryInput.ConvertedStartTime`;
    const queryEndTimeSubPath = `${contextPathPrefix}.StartQueryInput.ConvertedEndTime`;
    const startQueryOutputPathPrefix = `${contextPathPrefix}.StartQueryOutput`;
    const queryIdPath = `${startQueryOutputPathPrefix}.QueryId`;
    const queryResultsPathPrefix = `${contextPathPrefix}.GetQueryResultsOutput`;

    return new EvaluateExpression(this, `CalculateQueryStartTime${disambiguator}`, {
      expression: buildEpochConversionMillisToSecondsExpression(inputStartTimePath),
      resultPath: queryStartTimeSubPath,
    }).next(
      new EvaluateExpression(this, `CalculateQueryEndTime${disambiguator}`, {
        expression: buildEpochConversionMillisToSecondsExpression(inputEndTimePath),
        resultPath: queryEndTimeSubPath,
      }),
    ).next(
      // TODO: follow up with AWS tech support for SLA
      new Wait(this, `CourtesyWaitForLogPropagation${disambiguator}`, {
        time: WaitTime.duration(Duration.minutes(2)),
      }),
    ).next(
      new CallAwsService(this, `StartQuery-LocateFailedExecutions${disambiguator}`, {
        service: 'cloudwatchlogs',
        action: 'startQuery',
        parameters: {
          StartTime: JsonPath.stringAt(queryStartTimeSubPath),
          EndTime: JsonPath.stringAt(queryEndTimeSubPath),
          LogGroupName: this.acquireSemaphoreStateMachineProps!.logs!.destination.logGroupName,
          QueryString: JsonPath.format(
            ''.concat(
              'fields details.input, @timestamp, @message',
              '| filter id = "1"',
              '| parse details.input /"AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID":"(?<semaphoreUseExecutionArn>.*?)"/',
              '| parse details.input /"name":"(?<semaphoreName>.*?)"/',
              '| parse details.input /"userId":"(?<semaphoreUserId>.*?)"/',
              '| filter semaphoreUseExecutionArn = "{}"',
              '| display semaphoreName, semaphoreUserId',
            ),
            JsonPath.stringAt('$$.Execution.Input.detail.executionArn'),
          ),
        },
        iamResources: [this.acquireSemaphoreStateMachineProps!.logs!.destination.logGroupArn],
        iamAction: 'logs:StartQuery',
        resultPath: startQueryOutputPathPrefix, // merge service integration result into context
      }),
    ).next(
      // TODO: make it periodically check if the query is done
      new Wait(this, `WaitForQueryResults${disambiguator}`, {
        time: WaitTime.duration(Duration.minutes(1)), // a query times out after 15 minutes
      }),
    ).next(
      new CallAwsService(this, `GetQueryResults-LocateFailedExecutions${disambiguator}`, {
        service: 'cloudwatchlogs',
        action: 'getQueryResults',
        parameters: {
          QueryId: JsonPath.stringAt(queryIdPath),
        },
        iamAction: 'logs:GetQueryResults',
        iamResources: ['*'],
        resultPath: queryResultsPathPrefix, // merge service integration result into context
      }),
    ).next(
      // TODO: need to check if JsonPath.stringAt(`${queryResultsPathPrefix}.Results`) is an empty array, meaning CW logs insights delayed
      new Map(this, `MapToCleanups${disambiguator}`, {
        // TODO: allow max concurrency control via props?
        itemsPath: JsonPath.stringAt(`${queryResultsPathPrefix}.Results`),
        parameters: {
          resultIndex: JsonPath.stringAt('$$.Map.Item.Index'),
          resultValue: JsonPath.stringAt('$$.Map.Item.Value'),
        },
      }).iterator(
        new Pass(this, `ParseReleaseInput${disambiguator}`, {
          parameters: {
            name: JsonPath.stringAt('$.resultValue[0].Value'),
            userId: JsonPath.stringAt('$.resultValue[1].Value'),
          },
        }).next(
          // TODO: ideally, should checkSemaphoreUseFirst
          new ReleaseViaStartExecutionFragment(this, `ExperimentalViaStartExecutionFragment${disambiguator}`, {
            stateMachine: this.releaseStateMachine,
            input: {
              name: JsonPath.stringAt('$.name'),
              userId: JsonPath.stringAt('$.userId'),
            },
          }),
        ),
      ),
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

const buildEpochConversionMillisToSecondsExpression = (inputTimePath: string): string => {
  return `Math.floor(${inputTimePath} / 1000)`;
};