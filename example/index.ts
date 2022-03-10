// TODO: migrate Construct for cdk v2
import * as path from 'path';
import { Construct, Stack, StackProps, App, Duration, RemovalPolicy } from 'monocdk';
import { Runtime } from 'monocdk/aws-lambda';
import { PythonFunction } from 'monocdk/aws-lambda-python';
import { LogGroup, RetentionDays } from 'monocdk/aws-logs';
import { TaskInput, JsonPath, StateMachine, LogLevel, Pass } from 'monocdk/aws-stepfunctions';
import { LambdaInvoke } from 'monocdk/aws-stepfunctions-tasks';
import { DistributedSemaphore } from '../src/index';
import { DistributedSemaphore as DS } from '../src/semaphore';

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const doWork = new LambdaInvoke(this, 'DoWork', {
      lambdaFunction: new PythonFunction(this, 'DoWorkLambda', {
        entry: path.join(__dirname, 'lambda'),
        index: 'do_work_function/app.py',
        handler: 'lambda_handler',
        runtime: Runtime.PYTHON_3_8,
        timeout: Duration.seconds(60),
      }),
      payload: TaskInput.fromObject({
        Input: JsonPath.stringAt('$'),
      }),
      resultSelector: {
        'payload.$': '$.Payload',
      },
      retryOnServiceExceptions: false,
    });
    new DistributedSemaphore(this, 'DistributedSemaphore', {
      doWork,
    });
  }
}

class TestStackV2 extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const doWork = new LambdaInvoke(this, 'DoWork', {
      lambdaFunction: new PythonFunction(this, 'DoWorkLambda', {
        entry: path.join(__dirname, 'lambda'),
        index: 'do_work_function/app.py',
        handler: 'lambda_handler',
        runtime: Runtime.PYTHON_3_8,
        timeout: Duration.seconds(60),
      }),
      payload: TaskInput.fromObject({
        Input: JsonPath.stringAt('$'),
      }),
      resultSelector: {
        'payload.$': '$.Payload',
      },
      retryOnServiceExceptions: false,
      resultPath: '$.workResult',
    });
    const aSemaphoreName = JsonPath.format(
      '{}-{}-getCall',
      JsonPath.stringAt('$.accountId'),
      JsonPath.stringAt('$.region'),
    );
    // const aSemaphoreName = 'Semaphore1';
    const ds = new DS(this, 'DistributedSemaphore', {
      semaphores: [
        { name: aSemaphoreName, concurrencyLimit: 5 },
      ],
    });

    new StateMachine(this, 'Semaphore', {
      definition: ds.acquire().toSingleState().next(
        doWork,
      ).next(
        ds.release().toSingleState(),
      ).next(
        ds.acquire({ name: aSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
      ).next(
        new Pass(this, 'DoNothing'),
      ).next(
        ds.release({ name: aSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
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
  }
}

class TestApp extends App {
  constructor() {
    super();

    new TestStack(this, 'ConcurrencyControllerExample');
    new TestStackV2(this, 'ConcurrencyControllerExampleV2');
  }
}

new TestApp().synth();