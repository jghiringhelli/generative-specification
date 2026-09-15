import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth/token";
import { UnauthorizedError } from "../errors";

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/** Creates middleware that requires a valid Token authorization header. */
export function requireAuth(secret: string) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
    const header = request.header("Authorization");
    if (!header?.startsWith("Token ")) {
      next(new UnauthorizedError());
      return;
    }

    try {
      request.userId = verifyToken(header.slice("Token ".length), secret).userId;
      next();
    } catch {
      next(new UnauthorizedError());
    }
  };
}

/** Creates middleware that reads a token when one is present. */
export function optionalAuth(secret: string) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction): void => {
    const header = request.header("Authorization");
    if (!header?.startsWith("Token ")) {
      next();
      return;
    }

    try {
      request.userId = verifyToken(header.slice("Token ".length), secret).userId;
      next();
    } catch {
      next(new UnauthorizedError());
    }
  };
}
