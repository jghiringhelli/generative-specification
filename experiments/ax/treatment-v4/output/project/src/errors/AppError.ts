
/**
 * Base application error with HTTP status code.
 * All domain errors extend this class.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 422 Unprocessable Entity - validation or business rule violation
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(422, message, context);
  }
}

/**
 * 401 Unauthorized - missing or invalid authentication
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', context?: Record<string, unknown>) {
    super(401, message, context);
  }
}

/**
 * 403 Forbidden - authenticated but not permitted
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden', context?: Record<string, unknown>) {
    super(403, message, context);
  }
}

/**
 * 404 Not Found - resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(404, message);
  }
}
