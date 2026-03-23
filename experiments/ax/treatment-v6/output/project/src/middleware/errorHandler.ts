import type { Request, Response, NextFunction } from 'express';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from '../errors/AppError.js';

/** Standard API error response shape per RealWorld spec. */
interface ErrorResponse {
  errors: {
    body: string[];
  };
}

/**
 * Builds an error response object conforming to the RealWorld API error format.
 * All API errors must use: {"errors": {"body": ["message"]}}
 */
function buildErrorResponse(messages: string[]): ErrorResponse {
  return { errors: { body: messages } };
}

/**
 * Express error-handling middleware.
 * Maps domain errors (AppError subclasses) to HTTP status codes and RealWorld error format.
 * Must be registered last in the Express middleware chain.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    const messages = Object.entries(err.fieldErrors).flatMap(([field, errors]) =>
      errors.map((msg) => `${field} ${msg}`),
    );
    res.status(422).json(buildErrorResponse(messages));
    return;
  }

  if (err instanceof ConflictError) {
    res.status(422).json(buildErrorResponse([err.message]));
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json(buildErrorResponse([err.message]));
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json(buildErrorResponse([err.message]));
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json(buildErrorResponse([err.message]));
    return;
  }

  if (err instanceof AppError) {
    res.status(400).json(buildErrorResponse([err.message]));
    return;
  }

  // Unknown errors — do not leak internals in production
  res.status(500).json(buildErrorResponse(['Internal server error']));
}
