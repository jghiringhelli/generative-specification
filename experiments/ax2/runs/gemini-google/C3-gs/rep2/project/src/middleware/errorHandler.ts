import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Centralized Express error-handling middleware.
 * Ensures all responses adhere to RealWorld JSON specification:
 * { "errors": { "body": ["..."] } }
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      errors: err.errors,
    });
    return;
  }

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => e.message);
    res.status(422).json({
      errors: {
        body: errorMessages,
      },
    });
    return;
  }

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(422).json({
      errors: {
        body: ['Malformed JSON body in request'],
      },
    });
    return;
  }

  // Unhandled / Internal Server Errors
  res.status(500).json({
    errors: {
      body: [process.env.NODE_ENV === 'test' ? err.message : 'Internal server error'],
    },
  });
}
