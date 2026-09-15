import { HTTP_STATUS } from '../config/constants';

export interface ErrorResponseBody {
  readonly errors: {
    readonly body: readonly string[];
  };
}

/**
 * Formats error messages into the standard RealWorld error response format.
 *
 * @param {readonly string[]} messages - Array of error message strings
 * @returns {ErrorResponseBody} Structured error response object
 */
export function formatErrorResponse(messages: readonly string[]): ErrorResponseBody {
  return {
    errors: {
      body: messages
    }
  };
}

/**
 * Base application error with HTTP status code and message list.
 */
export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public readonly errors: readonly string[];

  constructor(messages: string | readonly string[]) {
    const errorList = Array.isArray(messages) ? messages : [messages];
    super(errorList[0] || 'An unexpected error occurred');
    this.errors = errorList;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = HTTP_STATUS.UNAUTHORIZED;
}

export class ForbiddenError extends AppError {
  public readonly statusCode = HTTP_STATUS.FORBIDDEN;
}

export class NotFoundError extends AppError {
  public readonly statusCode = HTTP_STATUS.NOT_FOUND;
}
