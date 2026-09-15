import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";

/**
 * Express error-handling middleware that renders errors in the RealWorld
 * spec format: `{"errors": {"body": ["message"]}}`.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ errors: { body: err.messages } });
    return;
  }
  res.status(500).json({ errors: { body: ["internal server error"] } });
}
