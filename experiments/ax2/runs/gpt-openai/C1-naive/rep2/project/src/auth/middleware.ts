import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors";
import { verifyToken } from "./auth";

function extractToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const [scheme, token] = header.split(" ");
  if (!token || !["Token", "Bearer"].includes(scheme)) return undefined;
  return token;
}

/** Requires a valid authentication token. */
export function requireAuthentication(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const token = extractToken(request.header("Authorization"));
  if (!token) return next(new UnauthorizedError("Authentication required"));
  try {
    request.userId = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

/** Adds the authenticated user when a valid token is present. */
export function optionalAuthentication(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const token = extractToken(request.header("Authorization"));
  if (!token) return next();
  try {
    request.userId = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
