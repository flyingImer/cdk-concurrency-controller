import { isPositiveInteger, JsonPath } from 'monocdk/aws-stepfunctions';

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