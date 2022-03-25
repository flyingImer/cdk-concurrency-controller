import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { JsonPath, LogLevel, Pass, StateGraph, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { SemaphoreDefinition } from '../src/fragments';
import { DistributedSemaphore, SemaphoreStateMachineProps } from '../src/semaphore';

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
      { name: dynamicSemaphoreName, limit: JsonPath.stringAt('$.limit') },
      { name: staticSemaphoreName, limit: '7' },
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

describe('Semaphore snapshots', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  const normalizeTokens = (obj: object): object => {
    const str = JSON.stringify(obj, (_, v) => v === undefined ? null : v); // this preserves undefined w/ null
    return JSON.parse(str.replace(/\${Token\[[A-Za-z0-9.]+\]}/g, '${Token[NORMALIZED_ID]}'));
  };

  it('snapshot tests: acquire state machine definition', () => {
    // GIVEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore');

    // WHEN
    const graph = new StateGraph(ds.__buildAcquireDefinition('Snapshot').startState, 'snapshot');

    // THEN
    expect(normalizeTokens(graph.toGraphJson())).toMatchSnapshot();
  });

  it('snapshot tests: release state machine definition', () => {
    // GIVEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore');

    // WHEN
    const graph = new StateGraph(ds.__buildReleaseDefinition('Snapshot').startState, 'snapshot');

    // THEN
    expect(normalizeTokens(graph.toGraphJson())).toMatchSnapshot();
  });

  it('snapshot tests: cleanup state machine definition', () => {
    // GIVEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore');

    // WHEN
    const graph = new StateGraph(ds.__buildCleanupDefinition('Snapshot').startState, 'snapshot');

    // THEN
    expect(normalizeTokens(graph.toGraphJson())).toMatchSnapshot();
  });

  it('snapshot tests: acquire task', () => {
    // GIVEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore');

    // WHEN
    const graph = new StateGraph(ds.acquire().startState, 'snapshot');

    // THEN
    expect(normalizeTokens(graph.toGraphJson())).toMatchSnapshot();
  });

  it('snapshot tests: release task', () => {
    // GIVEN
    const ds = new DistributedSemaphore(stack, 'DistributedSemaphore');

    // WHEN
    const graph = new StateGraph(ds.release().startState, 'snapshot');

    // THEN
    expect(normalizeTokens(graph.toGraphJson())).toMatchSnapshot();
  });
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
        limit: '1',
      },
      {
        name: JsonPath.stringAt('$.semaphore2Name'),
        limit: JsonPath.stringAt('$.semaphore2Limit'),
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
        limit: '0',
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
        limit: '1',
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
        limit: '',
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
        limit: '-1',
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
        limit: '1.1',
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
        limit: 'not-a-number',
      },
    ];

    // WHEN & THEN
    expect(() => new DistributedSemaphore(stack, 'DistributedSemaphore', {
      semaphores: customSemaphores,
    })).toThrowError();
  });
});

describe('Semaphore state machine props', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  it('should accept state machine props if provided', () => {
    // GIVEN
    const acquireSemaphoreStateMachineProps: SemaphoreStateMachineProps = {
      timeout: Duration.days(1),
      logs: {
        destination: new LogGroup(stack, 'AcquireSemaphoreLogGroup', {
          retention: RetentionDays.ONE_YEAR,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        level: LogLevel.ALL,
      },
      tracingEnabled: true,
    };

    const releaseSemaphoreStateMachineProps: SemaphoreStateMachineProps = {
      timeout: Duration.minutes(10),
      logs: {
        destination: new LogGroup(stack, 'ReleaseSemaphoreLogGroup', {
          retention: RetentionDays.TWO_MONTHS,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        includeExecutionData: false,
        level: LogLevel.ERROR,
      },
      tracingEnabled: true,
    };

    const cleanupSemaphoreStateMachineProps: SemaphoreStateMachineProps = {
      timeout: Duration.minutes(5),
      logs: {
        destination: new LogGroup(stack, 'CleanupSemaphoreLogGroup', {
          retention: RetentionDays.TWO_YEARS,
        }),
        level: LogLevel.FATAL,
      },
    };

    // WHEN
    new DistributedSemaphore(stack, 'DistributedSemaphore', {
      acquireSemaphoreStateMachineProps,
      releaseSemaphoreStateMachineProps,
      cleanupSemaphoreStateMachineProps,
    });

    // THEN
    const template = Template.fromStack(stack);
    expect(template.resourceCountIs('AWS::StepFunctions::StateMachine', 3));
    expect(template.resourceCountIs('AWS::Logs::LogGroup', 3));
    expect(template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      LoggingConfiguration: {
        IncludeExecutionData: true,
        Level: LogLevel.ALL,
      },
      TracingConfiguration: {
        Enabled: true,
      },
    }));
    expect(template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      LoggingConfiguration: {
        IncludeExecutionData: false,
        Level: LogLevel.ERROR,
      },
      TracingConfiguration: {
        Enabled: true,
      },
    }));
    expect(template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      LoggingConfiguration: {
        Level: LogLevel.FATAL,
      },
    }));
    expect(template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: RetentionDays.ONE_YEAR,
    }));
    expect(template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: RetentionDays.TWO_MONTHS,
    }));
    expect(template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: RetentionDays.TWO_YEARS,
    }));
  });

  it('should do nothing if not provided', () => {
    // GIVEN

    // WHEN
    new DistributedSemaphore(stack, 'DistributedSemaphore', {});

    // THEN
    const template = Template.fromStack(stack);
    expect(template.resourceCountIs('AWS::StepFunctions::StateMachine', 3));
    expect(template.resourceCountIs('AWS::Logs::LogGroup', 0));
    expect(template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      LoggingConfiguration: Match.absent(),
      TracingConfiguration: Match.absent(),
    }));
    expect(template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      LoggingConfiguration: Match.absent(),
      TracingConfiguration: Match.absent(),
    }));
    expect(template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      LoggingConfiguration: Match.absent(),
      TracingConfiguration: Match.absent(),
    }));
  });
});