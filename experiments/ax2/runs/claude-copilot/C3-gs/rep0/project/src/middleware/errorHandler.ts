import { NextFunction, Request, Response } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

/**
 * Build the Conduit error body: `{ "errors": { "body": ["message"] } }`.
 * @param messages - One or more error messages.
 * @returns The error response body.
 */
function errorBody(messages: string[]): { errors: { body: string[] } } {
  return { errors: { body: messages } };
}

/**
 * Central error-handling middleware. Maps known {@link AppError}s to their
 * HTTP status and the Conduit error format; unknown errors become 500.
 * @param error - The thrown error.
 * @param _req - The request (unused).
 * @param res - The response.
 * @param _next - The next function (unused; required for Express to treat this
 *   as an error handler).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (error instanceof ValidationError) {
    const messages = Object.entries(error.fields).flatMap(([field, msgs]) =>
      msgs.map((msg) => `${field} ${msg}`)
    );
    res.status(error.statusCode).json(errorBody(messages));
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json(errorBody([error.message]));
    return;
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json(errorBody([message]));
}

/**
 * Fallback 404 handler for unmatched routes.
 * @param _req - The request (unused).
 * @param res - The response.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(errorBody(['not found']));
}
