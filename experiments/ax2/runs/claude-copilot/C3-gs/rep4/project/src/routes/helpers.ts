import { Request } from 'express';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Return the authenticated user id set by the auth middleware, or throw when
 * absent. Used by handlers behind {@link requireAuth}.
 * @param req the incoming request.
 */
export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new UnauthorizedError('authentication required');
  }
  return req.userId;
}

/**
 * Parse RealWorld pagination query params with safe defaults and bounds.
 * @param query the request query object.
 * @returns limit (default 20, max 100) and offset (default 0).
 */
export function parsePagination(query: Record<string, unknown>): {
  limit: number;
  offset: number;
} {
  const limit = clampInt(query.limit, 20, 1, 100);
  const offset = clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  return { limit, offset };
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}
