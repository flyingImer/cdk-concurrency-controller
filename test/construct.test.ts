import { App, Stack } from 'monocdk';
import { Template } from 'monocdk/assertions';
import { JsonPath, Pass, StateMachine } from 'monocdk/aws-stepfunctions';
import { DistributedSemaphore } from '../src/index';
import { DistributedSemaphore as DistributedSemaphoreV2 } from '../src/semaphore';

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

test('snapshot test V2', () => {
  // GIVEN
  const stack = new Stack(new App(), 'SnapshotStack');

  const dynamicSemaphoreName = JsonPath.format(
    '{}-{}-getCall',
    JsonPath.stringAt('$.accountId'),
    JsonPath.stringAt('$.region'),
  );
  const staticSemaphoreName = 'NotDefaultName';
  const ds = new DistributedSemaphoreV2(stack, 'DistributedSemaphoreV2', {
    semaphores: [
      { name: dynamicSemaphoreName, concurrencyLimit: 6 },
      { name: staticSemaphoreName, concurrencyLimit: 7 },
    ],
  });

  new StateMachine(stack, 'Semaphore', {
    definition: ds.acquire().toSingleState().next(
      new Pass(stack, 'DoSomething'),
    ).next(
      ds.release().toSingleState(),
    ).next(
      ds.acquire({ name: dynamicSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
    ).next(
      new Pass(stack, 'DoNothing'),
    ).next(
      ds.release({ name: dynamicSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
    ).next(
      ds.acquire({ name: staticSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
    ).next(
      new Pass(stack, 'AllGood'),
    ).next(
      ds.release({ name: staticSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
    ).next(
      ds.acquire({ name: dynamicSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
    ).next(
      new Pass(stack, 'ItWorks'),
    ).next(
      ds.release({ name: dynamicSemaphoreName, userId: '$$.Execution.Id' }).toSingleState(),
    ),
  });

  // WHEN
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});