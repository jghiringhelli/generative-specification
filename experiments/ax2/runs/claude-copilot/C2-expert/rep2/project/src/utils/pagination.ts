const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

export interface Pagination {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Resolves and validates pagination parameters, applying RealWorld defaults
 * (limit=20, offset=0). Both values must be non-negative integers.
 * @param rawLimit the raw `limit` query value.
 * @param rawOffset the raw `offset` query value.
 * @returns the resolved {@link Pagination}.
 * @throws when a provided value is not a non-negative integer.
 */
export function resolvePagination(rawLimit?: unknown, rawOffset?: unknown): Pagination {
  return {
    limit: parseNonNegativeInt(rawLimit, DEFAULT_LIMIT, 'limit'),
    offset: parseNonNegativeInt(rawOffset, DEFAULT_OFFSET, 'offset')
  };
}

function parseNonNegativeInt(raw: unknown, fallback: number, field: string): number {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
