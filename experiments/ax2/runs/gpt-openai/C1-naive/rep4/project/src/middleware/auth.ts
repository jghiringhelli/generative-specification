import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../errors";

interface TokenPayload {
  userId: number;
}

function readToken(request: Request): string | undefined {
  const authorization = request.header("Authorization");
  if (!authorization) return undefined;

  const [scheme, token] = authorization.split(" ");
  return scheme === "Token" || scheme === "Bearer" ? token : undefined;
}

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = readToken(request);
  if (!token) {
    next(new ApiError(401, "authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    request.userId = payload.userId;
    next();
  } catch {
    next(new ApiError(401, "invalid authentication token"));
  }
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = readToken(request);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    request.userId = payload.userId;
    next();
  } catch {
    next(new ApiError(401, "invalid authentication token"));
  }
}
