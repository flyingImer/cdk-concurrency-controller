import * as path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Stack, StackProps, App, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { TaskInput, JsonPath, StateMachine, LogLevel, Pass, IChainable, Map, Errors, IntegrationPattern, IStateMachine, Result } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke, StepFunctionsStartExecution } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { ExperimentalDistributedSemaphore as DS } from '../src/experimental';

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const lambda = new PythonFunction(this, 'DoWorkLambda', {
      entry: path.join(__dirname, 'lambda'),
      index: 'do_work_function/app.py',
      handler: 'lambda_handler',
      runtime: Runtime.PYTHON_3_8,
      timeout: Duration.seconds(60),
    });
    const doWorkProps = {
      lambdaFunction: lambda,
      payload: TaskInput.fromObject({
        Input: JsonPath.stringAt('$'),
      }),
      resultSelector: {
        'payload.$': '$.Payload',
      },
      retryOnServiceExceptions: false,
      resultPath: '$.workResult',
    };
    const aSemaphoreName = JsonPath.format(
      '{}-{}-getCall',
      JsonPath.stringAt('$.accountId'),
      JsonPath.stringAt('$.region'),
    );

    const dsn = new DS(this, 'DistributedSemaphore', {
      defaultSemaphore: {
        name: 'DefaultSemaphore',
        limit: '2',
      },
      semaphores: [
        { name: aSemaphoreName, limit: '5' },
      ],
      acquireSemaphoreStateMachineProps: {
        timeout: Duration.days(1),
        logs: {
          destination: new LogGroup(this, 'AcquireSemaphoreLogGroup', {
            retention: RetentionDays.TWO_MONTHS,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
          includeExecutionData: true,
          level: LogLevel.ALL,
        },
        tracingEnabled: true,
      },
      releaseSemaphoreStateMachineProps: {
        timeout: Duration.days(1),
        logs: {
          destination: new LogGroup(this, 'ReleaseSemaphoreLogGroup', {
            retention: RetentionDays.TWO_MONTHS,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
          includeExecutionData: true,
          level: LogLevel.ALL,
        },
        tracingEnabled: true,
      },
      cleanupSemaphoreStateMachineProps: {
        timeout: Duration.days(1),
        logs: {
          destination: new LogGroup(this, 'CleanupSemaphoreLogGroup', {
            retention: RetentionDays.TWO_MONTHS,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
          includeExecutionData: true,
          level: LogLevel.ALL,
        },
        tracingEnabled: true,
      },
    });

    const semaphore = new StateMachine(this, 'Semaphore', {
      definition: dsn.acquire().toSingleState({ resultPath: JsonPath.DISCARD }).next(
        new LambdaInvoke(this, 'DoWork', doWorkProps),
      ).next(
        dsn.release().toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        dsn.acquire({ name: aSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        new Pass(this, 'DoNothing'),
      ).next(
        new LambdaInvoke(this, 'DoWork2', doWorkProps),
      ).next(
        dsn.release({ name: aSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        dsn.acquire().toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        dsn.acquire({ name: aSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        new LambdaInvoke(this, 'DoWork3', doWorkProps),
      ).next(
        dsn.release({ name: aSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        dsn.release().toSingleState({ resultPath: JsonPath.DISCARD }),
      ),
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
    dsn.listen(semaphore);

    new StateMachine(this, 'SemaphoreTesting', {
      definition: this.buildTesting(10, semaphore),
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

  private buildTesting(concurrentInputs: number, targetStateMachine: IStateMachine): IChainable {
    const targetId = targetStateMachine.node.id;
    const generateDefaultInput = new Pass(this, `GenerateTestingInput${targetId}`, {
      parameters: {
        iterations: Array.from({ length: concurrentInputs }, (_, i) => i + 1),
      },
    });

    const startInParallel = new Map(this, `StartInParallel${targetId}`, {
      maxConcurrency: 0,
      itemsPath: '$.iterations',
      parameters: {
        accountId: JsonPath.stringAt('$$.Map.Item.Value'),
        region: 'us-east-1',
      },
    });

    const runChildStateMachine = new StepFunctionsStartExecution(this, `RunChildStateMachine${targetId}`, {
      stateMachine: targetStateMachine,
      integrationPattern: IntegrationPattern.RUN_JOB,
      input: TaskInput.fromObject({
        accountId: JsonPath.stringAt('$.accountId'),
        region: JsonPath.stringAt('$.region'),
      }),
      resultSelector: {
        Nothing: 'Nothing',
      },
    });

    const clearResults = new Pass(this, `ClearResults${targetId}`, {
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

class TestApp extends App {
  constructor() {
    super();
    new TestStack(this, 'ConcurrencyControllerExample');
  }
}

new TestApp().synth();