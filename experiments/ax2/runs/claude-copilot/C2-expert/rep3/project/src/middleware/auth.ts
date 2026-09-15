import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/token';
import { UnauthorizedError } from '../utils/errors';

const TOKEN_SCHEME = 'Token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Extracts a bearer-style token from the Authorization header.
 * RealWorld uses the `Token <jwt>` scheme.
 * @param header the raw Authorization header value
 * @returns the token string, or null when absent/malformed
 */
function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (scheme !== TOKEN_SCHEME || !value) {
    return null;
  }
  return value;
}

/**
 * Middleware that requires a valid authentication token.
 * Populates req.user or responds with 401.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    throw new UnauthorizedError('missing authentication token');
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new UnauthorizedError('invalid authentication token');
  }
}

/**
 * Middleware that optionally attaches req.user when a valid token is present,
 * but never rejects the request.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req.headers.authorization);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}
