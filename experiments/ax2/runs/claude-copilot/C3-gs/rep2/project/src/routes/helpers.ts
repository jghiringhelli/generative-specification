import { AuthedRequest } from '../middleware/auth';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Read the authenticated user id from the request or throw.
 * @param req - The authenticated request.
 * @returns The user id.
 * @throws UnauthorizedError if the id is absent.
 */
export function requireUserId(req: AuthedRequest): number {
  if (req.userId === undefined) {
    throw new UnauthorizedError();
  }
  return req.userId;
}

/** Parsed pagination parameters. */
export interface Pagination {
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * Parse `limit` and `offset` query parameters with RealWorld defaults.
 * @param query - The Express query object.
 * @returns Bounded pagination values.
 */
export function parsePagination(query: Record<string, unknown>): Pagination {
  const limit = toPositiveInt(query.limit, DEFAULT_LIMIT);
  const offset = toPositiveInt(query.offset, DEFAULT_OFFSET);
  return { limit, offset };
}

/**
 * Parse a query value to a non-negative integer, falling back to a default.
 * @param value - The raw query value.
 * @param fallback - The default when parsing fails.
 * @returns The parsed integer or the fallback.
 */
function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'string') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

/**
 * Read an optional single-string query parameter.
 * @param value - The raw query value.
 * @returns The string, or undefined if absent/non-string.
 */
export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
