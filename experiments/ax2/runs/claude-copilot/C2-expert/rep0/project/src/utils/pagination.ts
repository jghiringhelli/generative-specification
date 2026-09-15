import {
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_OFFSET
} from '../config';
import { ValidationError } from '../errors';

/** Normalized pagination parameters. */
export interface Pagination {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Parses and validates raw `limit`/`offset` query values into non-negative
 * integers, applying RealWorld defaults (limit 20, offset 0).
 * @param rawLimit The raw `limit` query value, if present.
 * @param rawOffset The raw `offset` query value, if present.
 * @returns The validated {@link Pagination}.
 * @throws {ValidationError} When a provided value is not a non-negative integer.
 */
export function parsePagination(
  rawLimit?: unknown,
  rawOffset?: unknown
): Pagination {
  const limit = parseNonNegativeInteger(
    rawLimit,
    DEFAULT_PAGINATION_LIMIT,
    'limit'
  );
  const offset = parseNonNegativeInteger(
    rawOffset,
    DEFAULT_PAGINATION_OFFSET,
    'offset'
  );
  return { limit, offset };
}

function parseNonNegativeInteger(
  raw: unknown,
  fallback: number,
  field: string
): number {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new ValidationError([`${field} must be a non-negative integer`]);
  }
  return value;
}
