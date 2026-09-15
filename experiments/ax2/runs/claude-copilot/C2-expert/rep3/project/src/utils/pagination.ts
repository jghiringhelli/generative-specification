import { ValidationError } from './errors';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/** Normalized pagination parameters. */
export interface Pagination {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Parses and validates a raw query value into a non-negative integer.
 * @param value the raw query value
 * @param fallback the default when the value is absent
 * @param field the field name for error messages
 * @returns the parsed non-negative integer
 * @throws Error when the value is not a valid non-negative integer
 */
function parseNonNegativeInt(
  value: unknown,
  fallback: number,
  field: string,
): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new PaginationError(`${field} must be a non-negative integer`);
  }
  return parsed;
}

/** Error thrown when pagination parameters are invalid (maps to HTTP 422). */
export class PaginationError extends ValidationError {
  constructor(message: string) {
    super([message]);
    this.name = 'PaginationError';
  }
}

/**
 * Resolves pagination parameters from raw query values, applying defaults
 * (limit=20, offset=0) and validating non-negativity.
 * @param rawLimit the raw limit query value
 * @param rawOffset the raw offset query value
 * @returns the normalized pagination
 * @throws PaginationError when a value is invalid
 */
export function resolvePagination(
  rawLimit: unknown,
  rawOffset: unknown,
): Pagination {
  const limit = parseNonNegativeInt(rawLimit, DEFAULT_LIMIT, 'limit');
  const offset = parseNonNegativeInt(rawOffset, DEFAULT_OFFSET, 'offset');
  return { limit, offset };
}
