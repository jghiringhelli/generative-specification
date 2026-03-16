/**
 * Base application error class.
 * All custom errors extend this to carry HTTP status and context.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 422 Unprocessable Entity - validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(422, message, context);
  }
}

/**
 * 401 Unauthorized - authentication required or failed
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

/**
 * 403 Forbidden - authenticated but not authorized
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(403, message);
  }
}

/**
 * 404 Not Found - resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}
