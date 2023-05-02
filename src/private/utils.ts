import { isPositiveInteger, JsonPath, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { SemaphoreTimeoutOptions } from './types';

/**
 * Check if the given literal string is a non negative integer value at compile time.
 *
 * Return 'false' if the input is a JsonPath expression.
 */
export const isDeterminedNonNegativeInteger = (value: string): boolean => {
  if (JsonPath.isEncodedJsonPath(value)) {
    return false;
  }
  const num = new Number(value);
  return !Number.isNaN(num) && isPositiveInteger(num.valueOf());
};

/**
 * As of aws-cdk-lib@2.63.0, `timeout` is a deprecated parameter
 * and we should be using taskTimeout instead.
 *
 * @param props SemaphoreTimeoutOptions
 * @returns A value for `taskTimeout`
 */
export const toTaskTimeout = ({ taskTimeout, timeout }: SemaphoreTimeoutOptions): undefined | Timeout =>
  taskTimeout ?? (timeout ? Timeout.duration(timeout) : undefined);
