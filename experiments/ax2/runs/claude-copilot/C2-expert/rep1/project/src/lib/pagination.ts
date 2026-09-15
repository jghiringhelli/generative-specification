import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../config/constants';
import { ValidationError } from '../lib/errors';

/** Normalised pagination parameters. */
export interface Pagination {
  limit: number;
  offset: number;
}

/**
 * Parses and validates limit/offset query parameters.
 * @param rawLimit the raw `limit` query value
 * @param rawOffset the raw `offset` query value
 * @returns normalised, non-negative integers with defaults applied
 * @throws ValidationError when values are not non-negative integers
 */
export function parsePagination(rawLimit: unknown, rawOffset: unknown): Pagination {
  return {
    limit: parseNonNegativeInt(rawLimit, DEFAULT_LIMIT, 'limit'),
    offset: parseNonNegativeInt(rawOffset, DEFAULT_OFFSET, 'offset')
  };
}

/**
 * Parses a single non-negative integer query parameter.
 * @param value the raw query value
 * @param fallback the default when the value is absent
 * @param field the field name for error messages
 * @returns the parsed non-negative integer
 * @throws ValidationError when the value is invalid
 */
function parseNonNegativeInt(value: unknown, fallback: number, field: string): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError([`${field} must be a non-negative integer`]);
  }
  return parsed;
}
