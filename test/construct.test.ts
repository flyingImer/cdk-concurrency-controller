import { App, Stack } from 'monocdk';
import { Template } from 'monocdk/assertions';
import { Pass } from 'monocdk/aws-stepfunctions';
import { DistributedSemaphore } from '../src';

test('snapshot test', () => {
  // GIVEN
  const stack = new Stack(new App(), 'SnapshotStack');
  new DistributedSemaphore(stack, 'DistributedSemaphore', {
    doWork: new Pass(stack, 'DoNothing', {}),
  });

  // WHEN
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});