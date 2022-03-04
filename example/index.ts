// TODO: migrate Construct for cdk v2
import * as path from 'path';
import { Construct, Stack, StackProps, App, Duration } from 'monocdk';
import { Runtime } from 'monocdk/aws-lambda';
import { PythonFunction } from 'monocdk/aws-lambda-python';
import { TaskInput, JsonPath } from 'monocdk/aws-stepfunctions';
import { LambdaInvoke } from 'monocdk/aws-stepfunctions-tasks';
import { DistributedSemaphore } from '../src';

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

class TestApp extends App {
  constructor() {
    super();

    new TestStack(this, 'ConcurrencyControllerExample');
  }
}

new TestApp().synth();