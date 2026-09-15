import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from '../config/constants';
import { ValidationError } from './error.util';

export interface PaginationParams {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Parses and validates pagination query parameters.
 *
 * @param {unknown} rawLimit - Raw query parameter for limit
 * @param {unknown} rawOffset - Raw query parameter for offset
 * @returns {PaginationParams} Validated limit and offset values
 * @throws {ValidationError} When parameters are negative or not valid integers
 */
export function parsePagination(rawLimit?: unknown, rawOffset?: unknown): PaginationParams {
  let limit = DEFAULT_PAGE_LIMIT;
  let offset = DEFAULT_PAGE_OFFSET;

  if (rawLimit !== undefined && rawLimit !== null && rawLimit !== '') {
    const parsedLimit = Number(rawLimit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
      throw new ValidationError('Limit must be a non-negative integer');
    }
    limit = parsedLimit;
  }

  if (rawOffset !== undefined && rawOffset !== null && rawOffset !== '') {
    const parsedOffset = Number(rawOffset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      throw new ValidationError('Offset must be a non-negative integer');
    }
    offset = parsedOffset;
  }

  return { limit, offset };
}
