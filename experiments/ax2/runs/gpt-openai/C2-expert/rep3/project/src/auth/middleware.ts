import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from './token';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

function tokenFrom(request: Request): string | undefined {
  const authorization = request.header('authorization');
  return authorization?.startsWith('Token ') ? authorization.slice('Token '.length) : undefined;
}

/** Reads authentication when supplied and rejects invalid tokens. */
export function optionalAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const token = tokenFrom(request);
  if (!token) return next();
  try {
    request.userId = verifyToken(token).userId;
    next();
  } catch {
    response.status(401).json({ errors: { body: ['Invalid authorization token'] } });
  }
}

/** Requires a valid Token authorization header. */
export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const token = tokenFrom(request);
  if (!token) {
    response.status(401).json({ errors: { body: ['Authorization required'] } });
    return;
  }
  optionalAuth(request, response, next);
}
