import { NextFunction, Request, Response } from "express";

import { readToken } from "../auth";
import { ApiError } from "../errors";

function extractToken(request: Request): string | undefined {
  const authorization = request.header("authorization");
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(" ");
  return scheme.toLowerCase() === "token" ? token : undefined;
}

export function optionalAuthentication(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const token = extractToken(request);
  if (!token) return next();
  try {
    request.userId = readToken(token);
    next();
  } catch {
    next(new ApiError(401, { body: ["invalid authentication token"] }));
  }
}

export function requireAuthentication(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  optionalAuthentication(request, response, (error?: unknown) => {
    if (error) return next(error);
    if (!request.userId) {
      return next(new ApiError(401, { body: ["authentication required"] }));
    }
    next();
  });
}
