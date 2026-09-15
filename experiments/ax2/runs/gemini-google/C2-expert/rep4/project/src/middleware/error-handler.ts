import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../errors/http-error';

/**
 * Global Express error handling middleware.
 * Ensures all errors adhere to the API specification: { "errors": { "body": [...] } }.
 *
 * @param {unknown} err - Error object thrown in route/service
 * @param {Request} _req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next middleware function
 * @returns {void}
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      errors: {
        body: err.messages,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => {
      const fieldPath = e.path.join('.');
      return fieldPath ? `${fieldPath}: ${e.message}` : e.message;
    });

    res.status(422).json({
      errors: {
        body: errorMessages,
      },
    });
    return;
  }

  const genericMessage = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({
    errors: {
      body: [genericMessage],
    },
  });
}
