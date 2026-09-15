import { ApiErrorResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public errors: string[];

  constructor(statusCode: number, messageOrErrors: string | string[]) {
    const errorList = Array.isArray(messageOrErrors) ? messageOrErrors : [messageOrErrors];
    super(errorList.join(', '));
    this.statusCode = statusCode;
    this.errors = errorList;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(messageOrErrors: string | string[]) {
    super(422, messageOrErrors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(404, message);
  }
}

/**
 * Formats error messages into the standard Conduit error response format.
 */
export function formatErrorResponse(errors: string | string[]): ApiErrorResponse {
  const body = Array.isArray(errors) ? errors : [errors];
  return {
    errors: {
      body
    }
  };
}
