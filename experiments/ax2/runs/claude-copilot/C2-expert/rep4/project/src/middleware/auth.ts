import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth";
import { UnauthorizedError } from "../lib/errors";

/** Authenticated user identity attached to the request. */
export interface AuthUser {
  id: number;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Extract a bearer/Token credential from the Authorization header.
 * @param header The raw Authorization header value.
 * @returns The token string, or null when absent/malformed.
 */
function extractToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!value) return null;
  if (scheme !== "Token" && scheme !== "Bearer") return null;
  return value;
}

/**
 * Middleware that requires a valid JWT and attaches the user to the request.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next(new UnauthorizedError("authentication required"));
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("invalid token"));
  }
}

/**
 * Middleware that attaches the user when a valid JWT is present but does
 * not reject the request when authentication is missing.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }
  try {
    req.user = verifyToken(token);
  } catch {
    // Ignore invalid tokens for optional authentication.
  }
  next();
}
