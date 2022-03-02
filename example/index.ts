// TODO: migrate Construct for cdk v2
import { Construct, Stack, StackProps, App } from 'monocdk';
import { DistributedSemaphore } from '../src';

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    new DistributedSemaphore(this, 'DistributedSemaphore');
  }
}

class TestApp extends App {
  constructor() {
    super();

    new TestStack(this, 'ConcurrencyControllerExample');
  }
}

new TestApp().synth();