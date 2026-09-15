import { NextFunction, Request, Response } from 'express';
import { ITokenService } from '../services/ports/ITokenService';
import { UnauthorizedError } from '../errors/AppError';

/** Extract a JWT from an `Authorization: Token <jwt>` / `Bearer <jwt>` header. */
function extractToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (!value || (scheme !== 'Token' && scheme !== 'Bearer')) {
    return null;
  }
  return value;
}

/**
 * Build a strict authentication middleware that rejects requests without a valid
 * token. On success it populates `req.userId` and `req.token`.
 * @param tokens the token service used to verify credentials.
 */
export function requireAuth(tokens: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('authentication required');
    }
    req.userId = tokens.verify(token);
    req.token = token;
    next();
  };
}

/**
 * Build an optional authentication middleware that populates `req.userId` when a
 * valid token is present and otherwise proceeds anonymously.
 * @param tokens the token service used to verify credentials.
 */
export function optionalAuth(tokens: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = extractToken(req.headers.authorization);
    if (token) {
      req.userId = tokens.verify(token);
      req.token = token;
    }
    next();
  };
}
