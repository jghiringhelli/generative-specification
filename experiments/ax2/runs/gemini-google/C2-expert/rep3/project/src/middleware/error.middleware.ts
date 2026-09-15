import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

/**
 * Global error handling middleware.
 * Ensures all error responses strictly follow the Conduit specification:
 * { "errors": { "body": ["message1", ...] } }
 *
 * @param {Error} err The caught error
 * @param {Request} _req Express request
 * @param {Response} res Express response
 * @param {NextFunction} _next Express next function
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => {
      const field = e.path.filter((p) => p !== 'body' && p !== 'user' && p !== 'article' && p !== 'comment').join('.');
      return field ? `${field} ${e.message}` : e.message;
    });

    res.status(422).json({
      errors: {
        body: errorMessages.length > 0 ? errorMessages : ['Validation failed'],
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      errors: {
        body: err.messages,
      },
    });
    return;
  }

  // Fallback for unexpected errors
  res.status(500).json({
    errors: {
      body: [err.message || 'Internal server error'],
    },
  });
}
