/**
 * Base application error hierarchy.
 *
 * Domain and service layers throw these; the API error-handling middleware maps
 * each to an HTTP status and the Conduit error envelope `{ errors: { body: [...] } }`.
 */

/**
 * Base class for all known application errors.
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
 * Raised when a requested resource does not exist (HTTP 404).
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
 * Raised when authentication is missing or invalid (HTTP 401).
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
 * Raised when an authenticated user lacks permission (HTTP 403).
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
 * Raised when request input fails validation (HTTP 422).
 */
export class ValidationError extends AppError {
  /** Field-keyed list of validation messages for the Conduit error envelope. */
  public readonly fields: Record<string, string[]>;

  /**
   * @param fields - Map of field name to its validation messages.
   * @param message - Optional summary message.
   */
  constructor(fields: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422);
    this.fields = fields;
  }
}

/**
 * Raised when an operation conflicts with existing state (HTTP 409).
 */
export class ConflictError extends AppError {
  /**
   * @param message - Description of the conflict.
   */
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
