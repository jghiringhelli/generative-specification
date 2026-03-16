
/**
 * Application error class hierarchy.
 * All errors thrown in domain/service layers should extend AppError.
 * The error handler middleware maps these to HTTP responses.
 */

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, statusCode: number, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to RealWorld API error format.
   * Format: { errors: { body: [message, ...] } }
   */
  public toJSON(): { errors: { body: string[] } } {
    return {
      errors: {
        body: [this.message]
      }
    };
  }
}

/**
 * 404 Not Found
 * Resource does not exist (article, user, comment, etc.)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404);
  }
}

/**
 * 401 Unauthorized
 * Missing or invalid authentication credentials.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Authenticated but not permitted to perform this action.
 * Example: deleting another user's article.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'forbidden') {
    super(message, 403);
  }
}

/**
 * 422 Unprocessable Entity
 * Validation error — request is well-formed but semantically invalid.
 * Examples: missing required field, duplicate email, invalid format.
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 422, context);
  }

  /**
   * Create from field-specific validation errors.
   * @param errors - Map of field names to error messages
   * @example
   * ValidationError.fromFields({ email: "can't be blank", username: "already taken" })
   */
  public static fromFields(errors: Record<string, string>): ValidationError {
    const messages = Object.entries(errors)
      .map(([field, error]) => `${field} ${error}`)
      .join(', ');
    return new ValidationError(messages, { fields: errors });
  }
}

/**
 * 409 Conflict
 * Request conflicts with current state of the server.
 * Examples: duplicate unique field, already following a user.
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, context);
  }
}
