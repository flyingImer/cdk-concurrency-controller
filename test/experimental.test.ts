import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { JsonPath, StateMachine, Pass, StateGraph } from 'aws-cdk-lib/aws-stepfunctions';
import { ExperimentalDistributedSemaphore } from '../src/experimental';

test('snapshot test', () => {
  // GIVEN
  const stack = new Stack(new App(), 'SnapshotStack');

  const dynamicSemaphoreName = JsonPath.format(
    '{}-{}-getCall',
    JsonPath.stringAt('$.accountId'),
    JsonPath.stringAt('$.region'),
  );
  const staticSemaphoreName = 'NotDefaultName';
  const ds = new ExperimentalDistributedSemaphore(stack, 'ExperimentalDistributedSemaphore', {
    semaphores: [
      { name: dynamicSemaphoreName, limit: JsonPath.stringAt('$.limit') },
      { name: staticSemaphoreName, limit: '7' },
    ],
  });

  const testUse = new StateMachine(stack, 'Semaphore', {
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
  ds.listen(testUse);

  // WHEN
  const template = Template.fromStack(stack);

  // THEN
  expect(template.toJSON()).toMatchSnapshot();
});

describe('Semaphore snapshots', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  const normalizeTokens = (obj: object): object => {
    const str = JSON.stringify(obj, (_, v) => v === undefined ? null : v); // this preserves undefined w/ null
    return JSON.parse(str.replace(/\${Token\[[A-Za-z0-9.]+\]}/g, '${Token[NORMALIZED_ID]}'));
  };

  it('snapshot tests: exp state machine definition', () => {
    // GIVEN
    const ds = new ExperimentalDistributedSemaphore(stack, 'ExperimentalDistributedSemaphore');

    // WHEN
    const graph = new StateGraph(ds.__buildExpDefinition('Snapshot').startState, 'snapshot');

    // THEN
    expect(normalizeTokens(graph.toGraphJson())).toMatchSnapshot();
  });
});