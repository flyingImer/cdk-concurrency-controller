import { App, Stack } from 'monocdk';
import { Template } from 'monocdk/assertions';
import { JsonPath, Pass, StateMachine } from 'monocdk/aws-stepfunctions';
import { DistributedSemaphore } from '../src/semaphore';

test('snapshot test', () => {
  // GIVEN
  const stack = new Stack(new App(), 'SnapshotStack');

  const dynamicSemaphoreName = JsonPath.format(
    '{}-{}-getCall',
    JsonPath.stringAt('$.accountId'),
    JsonPath.stringAt('$.region'),
  );
  const staticSemaphoreName = 'NotDefaultName';
  const ds = new DistributedSemaphore(stack, 'DistributedSemaphore', {
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
      ds.acquire({ name: dynamicSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState(),
    ).next(
      new Pass(stack, 'DoNothing'),
    ).next(
      ds.release({ name: dynamicSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState(),
    ).next(
      ds.acquire({ name: staticSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState(),
    ).next(
      new Pass(stack, 'AllGood'),
    ).next(
      ds.release({ name: staticSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState(),
    ).next(
      ds.acquire({ name: dynamicSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState(),
    ).next(
      new Pass(stack, 'ItWorks'),
    ).next(
      ds.release({ name: dynamicSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }).toSingleState(),
    ),
  });

  // WHEN
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});