import { Duration } from 'aws-cdk-lib';
import { Timeout } from 'aws-cdk-lib/aws-stepfunctions';

export interface SemaphoreTimeoutOptions {
  /**
   * Maximum run time for the execution.
   *
   * @deprecated Use taskTimeout instead
   * @default No timeout
   */
  readonly timeout?: Duration;
  /**
   * Maximum run time for the execution.
   * @default No timeout
   */
  readonly taskTimeout?: Timeout;
}
