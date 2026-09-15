import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth/token";
import { UnauthorizedError } from "../errors/application-error";

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/** Creates middleware that requires a valid Token authorization header. */
export function requireAuth(jwtSecret: string) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
    try {
      const header = request.header("Authorization");
      if (!header?.startsWith("Token ")) {
        throw new UnauthorizedError();
      }
      request.userId = verifyToken(header.slice("Token ".length), jwtSecret).userId;
      next();
    } catch {
      next(new UnauthorizedError());
    }
  };
}

/** Creates middleware that attaches a user id when a valid token is present. */
export function optionalAuth(jwtSecret: string) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
    const header = request.header("Authorization");
    if (!header?.startsWith("Token ")) {
      next();
      return;
    }
    try {
      request.userId = verifyToken(header.slice("Token ".length), jwtSecret).userId;
    } catch {
      next(new UnauthorizedError());
      return;
    }
    next();
  };
}
