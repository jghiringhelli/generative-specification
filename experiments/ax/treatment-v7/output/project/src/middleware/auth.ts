import type { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';

// §11 ESM-safe import: jsonwebtoken is CJS — use default import + destructure
const { verify } = pkg;

/** JWT_SECRET from environment — validated at server startup (see server.ts). */
const JWT_SECRET = process.env.JWT_SECRET ?? '';

/** Authorization header prefix required by the Conduit specification. */
const TOKEN_PREFIX = 'Token ';

/** Shape of the JWT payload issued at registration/login. */
export interface JwtPayload {
  id: number;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Authenticated user's numeric ID. Attached by `requireAuth` middleware. */
      userId?: number;
      /** Authenticated user's email. Attached by `requireAuth` middleware. */
      userEmail?: string;
    }
  }
}

/**
 * Middleware that requires a valid `Token <jwt>` in the Authorization header.
 *
 * On success: sets `req.userId` and `req.userEmail` for downstream handlers.
 * On failure: forwards `UnauthorizedError` to Express's error pipeline (→ HTTP 401).
 *
 * @param req - Incoming request
 * @param _res - Response (unused — error is forwarded via next)
 * @param next - Next middleware function
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith(TOKEN_PREFIX)) {
    next(new UnauthorizedError());
    return;
  }
  const token = authHeader.slice(TOKEN_PREFIX.length);
  try {
    const payload = verify(token, JWT_SECRET) as JwtPayload;
    req.userId = payload.id;
    req.userEmail = payload.email;
    next();
  } catch {
    next(new UnauthorizedError());
  }
}

/**
 * Middleware that optionally parses a `Token <jwt>` from the Authorization header.
 *
 * Unlike `requireAuth`, this never rejects the request. If a valid token is present,
 * `req.userId` and `req.userEmail` are set; otherwise the request continues
 * unauthenticated (both fields remain undefined).
 *
 * Use for endpoints that serve different content to authenticated vs anonymous viewers
 * (e.g. GET /api/profiles/:username shows `following: true/false` based on auth).
 *
 * @param req - Incoming request
 * @param _res - Response (unused)
 * @param next - Next middleware function
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith(TOKEN_PREFIX)) {
    const token = authHeader.slice(TOKEN_PREFIX.length);
    try {
      const payload = verify(token, JWT_SECRET) as JwtPayload;
      req.userId = payload.id;
      req.userEmail = payload.email;
    } catch {
      // Invalid token — treat as anonymous; do not reject the request
    }
  }
  next();
}
