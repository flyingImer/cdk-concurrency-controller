import { App, Stack } from 'monocdk';
import { Template } from 'monocdk/assertions';
import { JsonPath, Pass, StateMachine } from 'monocdk/aws-stepfunctions';
import { SemaphoreDefinition } from '../src/fragments';
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
      { name: dynamicSemaphoreName, concurrencyLimit: JsonPath.stringAt('$.concurrencyLimit') },
      { name: staticSemaphoreName, concurrencyLimit: '7' },
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

  // THEN
  expect(template.toJSON()).toMatchSnapshot();
});

describe('Semaphore definition', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  it('should accept correct custom semaphore definitions', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: 'semaphore1',
        concurrencyLimit: '1',
      },
      {
        name: JsonPath.stringAt('$.semaphore2Name'),
        concurrencyLimit: JsonPath.stringAt('$.semaphore2Limit'),
      },
    ];

    // WHEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    });

    // THEN
    expect(ds.allSemaphores.length).toEqual(3);
    customSemaphores.forEach(
      customSemaphore => expect(ds.allSemaphores).toContainEqual(customSemaphore),
    );
    expect(ds.allSemaphores).toContainEqual(ds.defaultSemaphore);
  });

  it('should accept given a semaphore limit string literal is 0', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: 'semaphore1',
        concurrencyLimit: '0',
      },
    ];

    // WHEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    });

    // THEN
    expect(ds.allSemaphores.length).toEqual(2);
    customSemaphores.forEach(
      customSemaphore => expect(ds.allSemaphores).toContainEqual(customSemaphore),
    );
    expect(ds.allSemaphores).toContainEqual(ds.defaultSemaphore);
  });

  it('should throw error if semaphore name is an empty string', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: '',
        concurrencyLimit: '1',
      },
    ];

    // WHEN & THEN
    expect(() => new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    })).toThrowError();
  });

  it('should throw error if semaphore limit is an empty string', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: 'semaphore1',
        concurrencyLimit: '',
      },
    ];

    // WHEN & THEN
    expect(() => new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    })).toThrowError();
  });

  it('should throw error if semaphore limit string literal is a negative integer', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: 'semaphore1',
        concurrencyLimit: '-1',
      },
    ];

    // WHEN & THEN
    expect(() => new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    })).toThrowError();
  });

  it('should throw error if semaphore limit string literal is a non-integer number', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: 'semaphore1',
        concurrencyLimit: '1.1',
      },
    ];

    // WHEN & THEN
    expect(() => new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    })).toThrowError();
  });

  it('should throw error if semaphore limit string literal is not a number', () => {
    // GIVEN
    const customSemaphores: SemaphoreDefinition[] = [
      {
        name: 'semaphore1',
        concurrencyLimit: 'not-a-number',
      },
    ];

    // WHEN & THEN
    expect(() => new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    })).toThrowError();
  });
});