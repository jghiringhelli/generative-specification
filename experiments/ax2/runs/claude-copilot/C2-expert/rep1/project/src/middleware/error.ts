import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../lib/errors';

/**
 * Central error-handling middleware. Maps domain errors to the RealWorld
 * error envelope: `{"errors": {"body": ["message"]}}`.
 * @param err the thrown error
 * @param _req the request (unused)
 * @param res the response
 * @param _next the next handler (unused, required for Express signature)
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(err.status).json({ errors: { body: err.messages } });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ errors: { body: [err.message] } });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ errors: { body: [message] } });
}
