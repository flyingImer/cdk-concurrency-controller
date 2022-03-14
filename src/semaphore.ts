import { Construct } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/aws-dynamodb';
import { StateMachineFragment } from 'monocdk/aws-stepfunctions';
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

  private count = 0;

  constructor(scope: Construct, id: string, props: DistributedSemaphoreProps = {}) {
    super(scope, id);

    const { defaultSemaphore = { name: 'DefaultSemaphore', concurrencyLimit: 5 }, semaphores } = props;
    // TODO: default name cannot have JsonPath expression
    // TODO: default concurrency limit cannot below 0
    this.defaultSemaphoreName = defaultSemaphore.name;
    this.defaultSemaphoreUseOptions = { name: this.defaultSemaphoreName, userId: '$$.Execution.Id' }; // TODO: how to communicate default userId?

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
  }

  /**
   * Acquire a permit for a limited resource.
   *
   * @param options use default semaphore if not specified
   */
  public acquire(options: AcquireOptions = { ...this.defaultSemaphoreUseOptions }): StateMachineFragment {
    this.validateSemaphoreUseOptions(options);

    return new AcquireSemaphoreFragment(this, `AcquireSemaphore${this.count++}`, {
      ...options,
      concurrencyLimit: this.semaphoreMap.get(options.name)!.concurrencyLimit,
      semaphoreTable: this.semaphoreTable,
      retryStrategy: {
        maxAttempts: 6,
        backoffRate: 2,
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

    return new ReleaseSemaphoreFragment(this, `ReleaseSemaphore${this.count++}`, {
      ...options,
      semaphoreTable: this.semaphoreTable,
    });
  }

  public get semaphoreNames(): string[] {
    return Array.from(this.semaphoreMap.keys());
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