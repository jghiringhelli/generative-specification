import { NextFunction, Request, Response } from "express";
import { AuthenticationError } from "../errors";
import { verifyToken } from "../auth/token";

export type AuthenticatedRequest = Request & {
  userId: number;
};

/** Creates middleware that requires a valid Token authorization header. */
export function createAuthMiddleware(secret: string) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const [scheme, token] = request.header("authorization")?.split(" ") ?? [];
    if (scheme !== "Token" || !token) {
      next(new AuthenticationError());
      return;
    }
    try {
      (request as AuthenticatedRequest).userId = verifyToken(token, secret).userId;
      next();
    } catch {
      next(new AuthenticationError());
    }
  };
}

/** Creates middleware that reads a valid token when one is supplied. */
export function createOptionalAuthMiddleware(secret: string) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const [scheme, token] = request.header("authorization")?.split(" ") ?? [];
    if (!token) {
      next();
      return;
    }
    if (scheme !== "Token") {
      next(new AuthenticationError());
      return;
    }
    try {
      (request as AuthenticatedRequest).userId = verifyToken(token, secret).userId;
      next();
    } catch {
      next(new AuthenticationError());
    }
  };
}
