import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

/** Creates middleware that validates and replaces the request body. */
export function validateBody(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      request.body = schema.parse(request.body);
      next();
    } catch (error) {
      next(error instanceof ZodError ? toValidationError(error) : error);
    }
  };
}

function toValidationError(error: ZodError): ValidationError {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.at(-1)?.toString() ?? 'body';
    details[field] = [...(details[field] ?? []), issue.message];
  }
  return new ValidationError(details);
}
