/**
 * Base application error hierarchy.
 *
 * Domain and service layers throw these typed errors. The API error-handling
 * middleware maps each to an HTTP status code and the RealWorld error envelope
 * `{ "errors": { "body": ["message"] } }`.
 */

/**
 * Base class for all application errors.
 */
export class AppError extends Error {
  /** HTTP status code the API layer should emit for this error. */
  public readonly statusCode: number;

  /**
   * @param message - Human-readable error message.
   * @param statusCode - HTTP status code associated with the error.
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Raised when a requested resource does not exist. Maps to HTTP 404.
 */
export class NotFoundError extends AppError {
  /**
   * @param message - Description of the missing resource.
   */
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Raised when authentication is missing or invalid. Maps to HTTP 401.
 */
export class UnauthorizedError extends AppError {
  /**
   * @param message - Description of the authentication failure.
   */
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Raised when an authenticated user lacks permission. Maps to HTTP 403.
 */
export class ForbiddenError extends AppError {
  /**
   * @param message - Description of the authorization failure.
   */
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Raised when request input fails validation. Maps to HTTP 422.
 */
export class ValidationError extends AppError {
  /** Field-keyed validation messages, matching the RealWorld error envelope. */
  public readonly fields: Record<string, string[]>;

  /**
   * @param fields - Map of field name to list of validation messages.
   * @param message - Optional summary message.
   */
  constructor(fields: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422);
    this.fields = fields;
  }
}

/**
 * Raised when a request conflicts with existing state (e.g. duplicate email).
 * Maps to HTTP 409.
 */
export class ConflictError extends AppError {
  /**
   * @param message - Description of the conflict.
   */
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
