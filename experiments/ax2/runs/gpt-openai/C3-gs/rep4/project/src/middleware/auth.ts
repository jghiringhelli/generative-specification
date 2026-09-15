import type { NextFunction, Request, Response } from 'express';
import type { ITokenService } from '../auth/JwtTokenService';
import { UnauthorizedError } from '../errors/AppError';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Creates middleware requiring a valid Conduit Token authorization header. */
export function requireAuth(tokens: ITokenService) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const token = extractToken(request);
    const userId = token ? tokens.read(token) : null;
    if (!userId) {
      next(new UnauthorizedError());
      return;
    }
    request.userId = userId;
    next();
  };
}

/** Creates middleware that attaches an identity when a valid token is present. */
export function optionalAuth(tokens: ITokenService) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const token = extractToken(request);
    const userId = token ? tokens.read(token) : null;
    if (userId) {
      request.userId = userId;
    }
    next();
  };
}

function extractToken(request: Request): string | null {
  const authorization = request.header('authorization');
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(' ');
  return scheme === 'Token' && token ? token : null;
}
