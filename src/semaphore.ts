import { Construct, Duration } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/aws-dynamodb';
import { INextable, IntegrationPattern, IStateMachine, JsonPath, Pass, State, StateMachine, StateMachineFragment, TaskInput } from 'monocdk/aws-stepfunctions';
import { StepFunctionsStartExecution } from 'monocdk/aws-stepfunctions-tasks';
import { Rule } from 'monocdk/lib/aws-events';
import { SfnStateMachine } from 'monocdk/lib/aws-events-targets';
import { AcquireSemaphoreFragment, AcquireSemaphoreOptions, ReleaseSemaphoreFragment, ReleaseSemaphoreOptions, SemaphoreDefinition, SemaphoreTableDefinition, SemaphoreUseOptions } from './fragments';

export interface DistributedSemaphoreProps {
  /**
   * The default semaphore settings. It is used when no other pattern of semaphore applied.
   * This can be used as a quick start when working with a single arbitrary resource.
   *
   * NOTE: the default semaphore name cannot use JsonPath expression for the sake of a safe fallback.
   *
   * @default '{ name: "DefaultSemaphore", concurrencyLimit: 5 }'
   */
  readonly defaultSemaphore?: SemaphoreDefinition;

  readonly semaphores?: SemaphoreDefinition[];
}

export class DistributedSemaphore extends Construct {
  public readonly semaphoreTable: SemaphoreTableDefinition;

  private readonly defaultSemaphoreName: string;
  private readonly semaphoreMap = new Map<string, SemaphoreDefinition>();
  private readonly defaultSemaphoreUseOptions: SemaphoreUseOptions;
  private readonly acquireStateMachine: StateMachine;
  private readonly releaseStateMachine: StateMachine;
  private readonly cleanupStateMachine: StateMachine;

  private count = 0;

  constructor(scope: Construct, id: string, props: DistributedSemaphoreProps = {}) {
    super(scope, id);

    const { defaultSemaphore = { name: 'DefaultSemaphore', concurrencyLimit: '5' }, semaphores } = props;
    // TODO: default name cannot have JsonPath expression
    // TODO: default concurrency limit cannot below 0
    this.defaultSemaphoreName = defaultSemaphore.name;
    this.defaultSemaphoreUseOptions = { name: this.defaultSemaphoreName, userId: JsonPath.stringAt('$$.Execution.Id') }; // TODO: how to communicate default userId?

    this.semaphoreMap.set(this.defaultSemaphoreName, defaultSemaphore);
    !!semaphores && semaphores.forEach((semaphore) => {
      if (this.semaphoreMap.has(semaphore.name)) {
        throw new Error(`Semaphore ${semaphore.name} is already defined.`);
      }
      this.semaphoreMap.set(semaphore.name, semaphore);
    });

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

    // TODO: enable logging
    this.acquireStateMachine = new StateMachine(this, 'AcquireSemaphoreStateMachine', {
      definition: new AcquireSemaphoreFragment(this, 'AcquireSemaphoreFragment', {
        name: JsonPath.stringAt('$.name'),
        concurrencyLimit: JsonPath.stringAt('$.concurrencyLimit'),
        userId: JsonPath.stringAt('$.userId'),
        semaphoreTable: this.semaphoreTable,
        // TODO: expose retry strategy
        retryStrategy: {
          maxAttempts: 6,
          backoffRate: 2,
        },
      }),
    });

    this.releaseStateMachine = new StateMachine(this, 'ReleaseSemaphoreStateMachine', {
      definition: new ReleaseSemaphoreFragment(this, 'ReleaseSemaphoreFragment', {
        name: JsonPath.stringAt('$.name'),
        userId: JsonPath.stringAt('$.userId'),
        semaphoreTable: this.semaphoreTable,
      }),
    });

    this.cleanupStateMachine = new StateMachine(this, 'CleanupSemaphoreStateMachine', {
      definition: new Pass(this, 'ParseOriginalInput', {
        parameters: {
          OriginalInput: JsonPath.stringToJson(JsonPath.stringAt('$$.Execution.Input.detail.input')),
        },
        outputPath: '$.OriginalInput',
      }).next(new ReleaseSemaphoreFragment(this, 'CleanupSemaphoreFragment', {
        name: JsonPath.stringAt('$.name'),
        userId: JsonPath.stringAt('$.userId'),
        semaphoreTable: this.semaphoreTable,
        checkSemaphoreUseFirst: true,
        retryStrategy: {
          interval: Duration.seconds(5),
          maxAttempts: 20,
          backoffRate: 1.4,
        },
      })),
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
  public acquire(options: AcquireOptions = { ...this.defaultSemaphoreUseOptions }): StateMachineFragment {
    this.validateSemaphoreUseOptions(options);

    return new AcquireViaStartExecutionFragment(this, `AcquireViaStartExecutionFragment${this.count++}`, {
      stateMachine: this.acquireStateMachine,
      input: {
        name: options.name,
        concurrencyLimit: this.semaphoreMap.get(options.name)!.concurrencyLimit,
        userId: options.userId,
        // TODO: expose dynamic wait config to allow starvation mitigation
      },
    });
  }

  /**
   * Release the permit for the resource.
   *
   * @param options use default semaphore if not specified
   */
  public release(options: ReleaseOptions = { ...this.defaultSemaphoreUseOptions }): StateMachineFragment {
    this.validateSemaphoreUseOptions(options);

    return new ReleaseViaStartExecutionFragment(this, `ReleaseViaStartExecutionFragment${this.count++}`, {
      stateMachine: this.releaseStateMachine,
      input: {
        name: options.name,
        userId: options.userId,
      },
    });
  }

  public get semaphoreNames(): string[] {
    return Array.from(this.semaphoreMap.keys());
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

  private validateSemaphoreUseOptions(options: SemaphoreUseOptions) {
    if (!this.semaphoreMap.has(options.name)) {
      throw new Error(`Semaphore ${options.name} is not defined.`);
    }
  }
}

// TODO: make user id optional
export interface AcquireOptions extends AcquireSemaphoreOptions { }
export interface ReleaseOptions extends ReleaseSemaphoreOptions { }

interface SemaphoreCommonInput {
  readonly name: string;
  readonly userId: string;
}

interface AcquireSemaphoreInput extends SemaphoreCommonInput {
  readonly concurrencyLimit: string;
}

interface ReleaseSemaphoreInput extends SemaphoreCommonInput { }

interface AcquireViaStartExecutionFragmentProps {
  readonly stateMachine: IStateMachine;
  readonly input: AcquireSemaphoreInput;
}

class AcquireViaStartExecutionFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: AcquireViaStartExecutionFragmentProps) {
    super(scope, id);
    this.startState = new StepFunctionsStartExecution(this, 'AcquireSemaphoreViaStartExecution', {
      stateMachine: props.stateMachine,
      integrationPattern: IntegrationPattern.RUN_JOB,
      associateWithParent: true,
      input: TaskInput.fromObject(props.input),
    });
    this.endStates = this.startState.endStates;
  }
}

interface ReleaseViaStartExecutionFragmentProps {
  readonly stateMachine: IStateMachine;
  readonly input: ReleaseSemaphoreInput;
}

class ReleaseViaStartExecutionFragment extends StateMachineFragment {
  public readonly startState: State;
  public readonly endStates: INextable[];

  constructor(scope: Construct, id: string, props: ReleaseViaStartExecutionFragmentProps) {
    super(scope, id);
    this.startState = new StepFunctionsStartExecution(this, 'ReleaseSemaphoreViaStartExecution', {
      stateMachine: props.stateMachine,
      integrationPattern: IntegrationPattern.RUN_JOB,
      associateWithParent: true,
      input: TaskInput.fromObject(props.input),
    });
    this.endStates = this.startState.endStates;
  }
}
