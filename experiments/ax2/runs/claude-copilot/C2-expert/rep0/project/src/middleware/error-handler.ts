import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';

/**
 * Express error-handling middleware translating {@link AppError}s and unknown
 * errors into the RealWorld envelope `{ "errors": { "body": ["..."] } }`.
 * @param error The thrown error.
 * @param _req The incoming request (unused).
 * @param res The outgoing response.
 * @param _next The next handler (unused, required by Express signature).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.status).json({ errors: { body: error.messages } });
    return;
  }
  res
    .status(500)
    .json({ errors: { body: ['internal server error'] } });
}

/**
 * Fallback handler for unmatched routes, producing a 404 in the API envelope.
 * @param _req The incoming request (unused).
 * @param res The outgoing response.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ errors: { body: ['not found'] } });
}
