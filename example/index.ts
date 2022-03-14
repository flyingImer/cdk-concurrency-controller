// TODO: migrate Construct for cdk v2
import * as path from 'path';
import { Construct, Stack, StackProps, App, Duration, RemovalPolicy } from 'monocdk';
import { Rule } from 'monocdk/aws-events';
import { SfnStateMachine } from 'monocdk/aws-events-targets';
import { Runtime } from 'monocdk/aws-lambda';
import { PythonFunction } from 'monocdk/aws-lambda-python';
import { LogGroup, RetentionDays } from 'monocdk/aws-logs';
import { TaskInput, JsonPath, StateMachine, LogLevel, Pass, IChainable, Chain, Map, Errors, IntegrationPattern, IStateMachine, Result } from 'monocdk/aws-stepfunctions';
import { LambdaInvoke, StepFunctionsStartExecution } from 'monocdk/aws-stepfunctions-tasks';
import { DistributedSemaphore as DS } from '../src/semaphore';

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
    const doWork = new LambdaInvoke(this, 'DoWork', doWorkProps);
    const doWork2 = new LambdaInvoke(this, 'DoWork2', doWorkProps);
    const aSemaphoreName = JsonPath.format(
      '{}-{}-getCall',
      JsonPath.stringAt('$.accountId'),
      JsonPath.stringAt('$.region'),
    );
    const ds = new DS(this, 'DistributedSemaphore', {
      semaphores: [
        { name: aSemaphoreName, concurrencyLimit: 5 },
      ],
    });

    const semaphore = new StateMachine(this, 'Semaphore', {
      definition: ds.acquire().toSingleState({ resultPath: JsonPath.DISCARD }).next(
        doWork,
      ).next(
        ds.release().toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        ds.acquire({ name: aSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState({ resultPath: JsonPath.DISCARD }),
      ).next(
        new Pass(this, 'DoNothing'),
      ).next(
        doWork2,
      ).next(
        ds.release({ name: aSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState({ resultPath: JsonPath.DISCARD }),
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

    const semaphoreCleanup = new StateMachine(this, 'SemaphoreCleanup', {
      definition: this.buildCleanup(ds),
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

  private buildCleanup(ds: DS): IChainable {
    const generateDefaultInput = new Pass(this, 'GenerateDefaultInput', {
      parameters: {
        OriginalInput: JsonPath.stringToJson(JsonPath.stringAt('$$.Execution.Input.detail.input')),
      },
      outputPath: '$.OriginalInput',
    });

    let prev = Chain.start(generateDefaultInput);
    ds.semaphoreNames.map(
      name => ds.release({
        name,
        userId: JsonPath.stringAt('$$.Execution.Input.detail.executionArn'),
        checkSemaphoreUseFirst: true,
        retryStrategy: {
          interval: Duration.seconds(5),
          maxAttempts: 20,
          backoffRate: 1.4,
        },
      }).toSingleState({ resultPath: JsonPath.DISCARD }),
    ).forEach(curr => {
      prev = prev.next(curr);
    });

    return prev;
  }

  private buildTesting(concurrentInputs: number, targetStateMachine: IStateMachine): IChainable {
    const generateDefaultInput = new Pass(this, 'GenerateTestingInput', {
      parameters: {
        iterations: Array.from({ length: concurrentInputs }, (_, i) => i + 1),
      },
    });

    const startInParallel = new Map(this, 'StartInParallel', {
      maxConcurrency: 0,
      itemsPath: '$.iterations',
      parameters: {
        accountId: JsonPath.stringAt('$$.Map.Item.Value'),
        region: 'us-east-1',
      },
    });

    const runChildStateMachine = new StepFunctionsStartExecution(this, 'RunChildStateMachine', {
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

class TestApp extends App {
  constructor() {
    super();
    new TestStack(this, 'ConcurrencyControllerExample');
  }
}

new TestApp().synth();