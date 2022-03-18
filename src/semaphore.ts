import { Construct, Duration } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/aws-dynamodb';
import { IChainable, IStateMachine, JsonPath, LogOptions, Pass, StateMachine, StateMachineFragment } from 'monocdk/aws-stepfunctions';
import { Rule } from 'monocdk/lib/aws-events';
import { SfnStateMachine } from 'monocdk/lib/aws-events-targets';
import { AcquireSemaphoreFragment, AcquireSemaphoreOptions, AcquireViaStartExecutionFragment, ReleaseSemaphoreFragment, ReleaseSemaphoreOptions, ReleaseViaStartExecutionFragment, SemaphoreDefinition, SemaphoreTableDefinition, SemaphoreTimeoutOptions, SemaphoreUseDefinition } from './fragments';
import { isDeterminedNonNegativeInteger } from './private/utils';

export interface DistributedSemaphoreProps {
  /**
   * The default semaphore settings. It is used when no other pattern of semaphore applied.
   * This can be used as a quick start when working with a single arbitrary resource.
   *
   * NOTE: the default semaphore name cannot use JsonPath expression for the sake of a safe fallback.
   *
   * @default '{ name: "DefaultSemaphore", limit: "5" }'
   */
  readonly defaultSemaphore?: SemaphoreDefinition;

  readonly semaphores?: SemaphoreDefinition[];

  readonly acquireSemaphoreStateMachineProps?: SemaphoreStateMachineProps;
  readonly releaseSemaphoreStateMachineProps?: SemaphoreStateMachineProps;
  readonly cleanupSemaphoreStateMachineProps?: SemaphoreStateMachineProps;
}

export class DistributedSemaphore extends Construct {
  public readonly semaphoreTable: SemaphoreTableDefinition;

  private readonly defaultSemaphoreName: string;
  private readonly semaphoreMap = new Map<string, SemaphoreDefinition>();
  private readonly defaultSemaphoreUseDefinition: SemaphoreUseDefinition;
  private readonly acquireStateMachine: StateMachine;
  private readonly releaseStateMachine: StateMachine;
  private readonly cleanupStateMachine: StateMachine;

  private count = 0;

  constructor(scope: Construct, id: string, props: DistributedSemaphoreProps = {}) {
    super(scope, id);

    const { defaultSemaphore = { name: 'DefaultSemaphore', limit: '5' }, semaphores, acquireSemaphoreStateMachineProps, releaseSemaphoreStateMachineProps, cleanupSemaphoreStateMachineProps: cleanupStateMachineProps } = props;
    this.defaultSemaphoreName = defaultSemaphore.name;
    this.defaultSemaphoreUseDefinition = { name: this.defaultSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }; // TODO: how to communicate default userId?

    this.semaphoreMap.set(this.defaultSemaphoreName, defaultSemaphore);
    !!semaphores && semaphores.forEach((semaphore) => {
      if (this.semaphoreMap.has(semaphore.name)) {
        throw new Error(`Semaphore ${semaphore.name} is already defined.`);
      }
      this.semaphoreMap.set(semaphore.name, semaphore);
    });
    this.validateSemaphoreDefinition();

    const table = new Table(this, 'SemaphoreTable', {
      partitionKey: {
        name: 'SemaphoreName',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      contributorInsightsEnabled: true,
    });
    this.semaphoreTable = {
      table,
      partitionKey: table.schema().partitionKey,
      countAttributeName: 'CurrentInUseCount',
    };

    this.acquireStateMachine = new StateMachine(this, 'AcquireSemaphoreStateMachine', {
      definition: this.__buildAcquireDefinition(),
      ...acquireSemaphoreStateMachineProps,
    });

    this.releaseStateMachine = new StateMachine(this, 'ReleaseSemaphoreStateMachine', {
      definition: this.__buildReleaseDefinition(),
      ...releaseSemaphoreStateMachineProps,
    });

    this.cleanupStateMachine = new StateMachine(this, 'CleanupSemaphoreStateMachine', {
      definition: this.__buildCleanupDefinition(),
      ...cleanupStateMachineProps,
    });

    new Rule(this, 'RunForIncomplete', {
      targets: [new SfnStateMachine(this.cleanupStateMachine)],
      eventPattern: {
        source: ['aws.states'],
        detail: {
          stateMachineArn: [
            this.acquireStateMachine.stateMachineArn,
            this.releaseStateMachine.stateMachineArn,
          ],
          status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
        },
      },
    });
  }

  /**
   * Acquire a permit for a limited resource.
   *
   * @param options use default semaphore if not specified
   */
  public acquire(options: AcquireOptions = { ...this.defaultSemaphoreUseDefinition }): StateMachineFragment {
    this.validateSemaphoreUseDefinition(options);

    if (!!options.nextTryWaitTime
      && !JsonPath.isEncodedJsonPath(options.nextTryWaitTime)
      && !isDeterminedNonNegativeInteger(options.nextTryWaitTime)) {
      throw new Error('Next retry wait time literal string must be a positive integer value.');
    }

    return new AcquireViaStartExecutionFragment(this, `AcquireViaStartExecutionFragment${this.count++}`, {
      stateMachine: this.acquireStateMachine,
      input: {
        name: options.name,
        limit: this.semaphoreMap.get(options.name)!.limit,
        userId: options.userId,
        nextTryWaitTime: options.nextTryWaitTime || '3',
      },
    });
  }

  /**
   * Release the permit for the resource.
   *
   * @param options use default semaphore if not specified
   */
  public release(options: ReleaseOptions = { ...this.defaultSemaphoreUseDefinition }): StateMachineFragment {
    this.validateSemaphoreUseDefinition(options);

    return new ReleaseViaStartExecutionFragment(this, `ReleaseViaStartExecutionFragment${this.count++}`, {
      stateMachine: this.releaseStateMachine,
      input: {
        name: options.name,
        userId: options.userId,
      },
    });
  }

  public get allSemaphores(): SemaphoreDefinition[] {
    return Array.from(this.semaphoreMap.values());
  }

  public get defaultSemaphore(): SemaphoreDefinition {
    return this.semaphoreMap.get(this.defaultSemaphoreName)!;
  }

  public get acquireSemaphoreStateMachine(): IStateMachine {
    return this.acquireStateMachine;
  }

  public get releaseSemaphoreStateMachine(): IStateMachine {
    return this.releaseStateMachine;
  }

  public get cleanupSemaphoreStateMachine(): IStateMachine {
    return this.cleanupStateMachine;
  }

  private validateSemaphoreDefinition(): void {
    this.semaphoreMap.forEach((definition) => {
      const { name, limit } = definition;
      if (!name || name.length === 0) {
        throw new Error('Semaphore name must be a non empty value.');
      }
      if (!limit || limit.length === 0) {
        throw new Error('Semaphore concurrency limit must be a non empty value.');
      }
      if (!JsonPath.isEncodedJsonPath(limit) && !isDeterminedNonNegativeInteger(limit)) {
        throw new Error('Semaphore concurrency limit literal string must be a positive integer value.');
      }
    });
  }

  private validateSemaphoreUseDefinition(options: SemaphoreUseDefinition): void {
    if (!this.semaphoreMap.has(options.name)) {
      throw new Error(`Semaphore ${options.name} is not defined.`);
    }
  }

  /**
   * @internal
   * For unit test only
   */
  __buildAcquireDefinition(disambiguator = ''): IChainable {
    return new AcquireSemaphoreFragment(this, `AcquireSemaphoreFragment${disambiguator}`, {
      name: JsonPath.stringAt('$.name'),
      limit: JsonPath.stringAt('$.limit'),
      userId: JsonPath.stringAt('$.userId'),
      nextTryWaitTime: JsonPath.stringAt('$.nextTryWaitTime'),
      semaphoreTable: this.semaphoreTable,
      retryStrategy: {
        maxAttempts: 6,
        backoffRate: 2,
      },
    });
  }

  /**
   * @internal
   * For unit test only
   */
  __buildReleaseDefinition(disambiguator = ''): IChainable {
    return new ReleaseSemaphoreFragment(this, `ReleaseSemaphoreFragment${disambiguator}`, {
      name: JsonPath.stringAt('$.name'),
      userId: JsonPath.stringAt('$.userId'),
      semaphoreTable: this.semaphoreTable,
    });
  }

  /**
   * @internal
   * For unit test only
   */
  __buildCleanupDefinition(disambiguator = ''): IChainable {
    return new Pass(this, `ParseOriginalInput${disambiguator}`, {
      parameters: {
        OriginalInput: JsonPath.stringToJson(JsonPath.stringAt('$$.Execution.Input.detail.input')),
      },
      outputPath: '$.OriginalInput',
    }).next(
      new ReleaseSemaphoreFragment(this, `CleanupSemaphoreFragment${disambiguator}`, {
        name: JsonPath.stringAt('$.name'),
        userId: JsonPath.stringAt('$.userId'),
        semaphoreTable: this.semaphoreTable,
        checkSemaphoreUseFirst: true,
        retryStrategy: {
          interval: Duration.seconds(5),
          maxAttempts: 20,
          backoffRate: 1.4,
        },
      }),
    );
  }
}

// TODO: make user id optional
export interface AcquireOptions extends AcquireSemaphoreOptions, SemaphoreTimeoutOptions { }
export interface ReleaseOptions extends ReleaseSemaphoreOptions, SemaphoreTimeoutOptions { }

export interface SemaphoreStateMachineProps extends SemaphoreTimeoutOptions {
  /**
   * Defines what execution history events are logged and where they are logged.
   *
   * @default No logging
   */
  readonly logs?: LogOptions;
  /**
   * Specifies whether Amazon X-Ray tracing is enabled for this state machine.
   *
   * @default false
   */
  readonly tracingEnabled?: boolean;
}
