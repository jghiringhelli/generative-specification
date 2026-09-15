import { Request } from 'express';
import { UnauthorizedError, ValidationError } from '../errors/AppError';
import { ArticleListFilter } from '../repositories/IArticleRepository';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * Read the authenticated user id from a request or throw.
 * @param req - Express request.
 * @returns The authenticated user id.
 */
export function requireUserId(req: Request): number {
  if (typeof req.userId !== 'number') {
    throw new UnauthorizedError('Authentication required');
  }
  return req.userId;
}

/**
 * Parse a positive integer query value with a fallback.
 * @param value - Raw query value.
 * @param fallback - Default when absent.
 * @param field - Field name for error reporting.
 * @returns The parsed integer.
 */
function parseIntParam(value: unknown, fallback: number, field: string): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError({ [field]: ['must be a non-negative integer'] });
  }
  return parsed;
}

/**
 * Read a single-valued string query parameter.
 * @param value - Raw query value.
 * @returns The string or undefined.
 */
function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Build an article list filter from request query parameters.
 * @param req - Express request.
 * @returns The parsed list filter.
 */
export function parseArticleFilter(req: Request): ArticleListFilter {
  return {
    tag: readString(req.query.tag),
    author: readString(req.query.author),
    favorited: readString(req.query.favorited),
    limit: parseIntParam(req.query.limit, DEFAULT_LIMIT, 'limit'),
    offset: parseIntParam(req.query.offset, DEFAULT_OFFSET, 'offset'),
  };
}

/**
 * Parse limit/offset for feed requests.
 * @param req - Express request.
 * @returns Limit and offset.
 */
export function parsePagination(req: Request): { limit: number; offset: number } {
  return {
    limit: parseIntParam(req.query.limit, DEFAULT_LIMIT, 'limit'),
    offset: parseIntParam(req.query.offset, DEFAULT_OFFSET, 'offset'),
  };
}
