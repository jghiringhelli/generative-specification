import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

function validationMessages(error: ZodError): ReadonlyArray<string> {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json({ errors: { body: validationMessages(error) } });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ errors: { body: [error.message] } });
    return;
  }
  response.status(500).json({ errors: { body: ['Internal server error'] } });
};
