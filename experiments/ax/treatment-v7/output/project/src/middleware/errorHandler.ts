import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

/**
 * Express error-handling middleware — must be the last middleware registered.
 *
 * Maps domain errors to Conduit-spec HTTP responses:
 *   - `ValidationError` → 422 with field-level error scoping
 *   - `AppError` subclasses → mapped status with resource-scoped envelope
 *   - Unknown errors → 500 (logged to stderr; detail not exposed to clients)
 *
 * Conduit error envelope format: `{ errors: { [resource]: ["message", ...] } }`
 *
 * @param err - The thrown error
 * @param _req - Incoming request (unused)
 * @param res - Response object
 * @param _next - Required 4-argument signature so Express recognises this as an error handler
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(422).json({ errors: err.fields });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ errors: { [err.resource]: [err.message] } });
    return;
  }
  console.error('[Unhandled error]', err);
  res.status(500).json({ errors: { server: ['Internal server error'] } });
}
