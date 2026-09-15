import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from '../config/constants';
import { ValidationError } from './errors';

export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Parses and validates pagination parameters.
 * Throws ValidationError (422) if limit or offset are negative or invalid integers.
 */
export function parsePagination(
  rawLimit?: unknown,
  rawOffset?: unknown
): PaginationParams {
  let limit = DEFAULT_PAGE_LIMIT;
  let offset = DEFAULT_PAGE_OFFSET;

  if (rawLimit !== undefined && rawLimit !== null && rawLimit !== '') {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new ValidationError('limit must be a non-negative integer');
    }
    limit = parsed;
  }

  if (rawOffset !== undefined && rawOffset !== null && rawOffset !== '') {
    const parsed = Number(rawOffset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new ValidationError('offset must be a non-negative integer');
    }
    offset = parsed;
  }

  return { limit, offset };
}
