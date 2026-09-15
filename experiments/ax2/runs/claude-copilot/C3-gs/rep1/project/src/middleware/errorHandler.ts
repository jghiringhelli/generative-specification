import { NextFunction, Request, Response } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

/**
 * Conduit error envelope shape.
 */
interface ErrorEnvelope {
  errors: { body: string[] };
}

/**
 * Build the Conduit error envelope from a list of messages.
 * @param messages - Error messages.
 * @returns The envelope object.
 */
function envelope(messages: string[]): ErrorEnvelope {
  return { errors: { body: messages } };
}

/**
 * Flatten a ValidationError's field map into `field message` strings.
 * @param error - The validation error.
 * @returns Flattened message list.
 */
function flattenValidation(error: ValidationError): string[] {
  const messages: string[] = [];
  for (const [field, fieldMessages] of Object.entries(error.fields)) {
    for (const message of fieldMessages) {
      messages.push(`${field} ${message}`);
    }
  }
  return messages.length > 0 ? messages : [error.message];
}

/**
 * Central Express error handler mapping AppErrors to HTTP responses using the
 * Conduit `{ errors: { body: [...] } }` envelope.
 * @param error - The thrown error.
 * @param _req - Express request (unused).
 * @param res - Express response.
 * @param _next - Express next handler (unused, required by signature).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json(envelope(flattenValidation(error)));
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json(envelope([error.message]));
    return;
  }
  res.status(500).json(envelope(['Internal server error']));
}
