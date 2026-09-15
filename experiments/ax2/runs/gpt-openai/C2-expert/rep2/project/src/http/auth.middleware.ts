import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/token';
import { AuthenticatedRequest } from './request';

const TOKEN_PREFIX = 'Token ';

/** Creates middleware that requires a valid Conduit authentication token. */
export function createAuthenticationMiddleware(jwtSecret: string) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const authorization = request.header('Authorization');
    if (!authorization?.startsWith(TOKEN_PREFIX)) {
      response.status(401).json({ errors: { body: ['authentication required'] } });
      return;
    }

    try {
      const claims = verifyToken(authorization.slice(TOKEN_PREFIX.length), jwtSecret);
      (request as AuthenticatedRequest).userId = claims.userId;
      next();
    } catch {
      response.status(401).json({ errors: { body: ['invalid authentication token'] } });
    }
  };
}
