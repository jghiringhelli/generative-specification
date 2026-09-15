/**
 * Base application error.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly messages: string[];

  /**
   * Initializes AppError.
   *
   * @param {number} statusCode HTTP status code
   * @param {string | string[]} message Error message or array of messages
   */
  constructor(statusCode: number, message: string | string[]) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages[0]);
    this.statusCode = statusCode;
    this.messages = messages;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validation error (HTTP 422).
 */
export class ValidationError extends AppError {
  /**
   * Initializes ValidationError with 422 status.
   *
   * @param {string | string[]} message Error messages
   */
  constructor(message: string | string[]) {
    super(422, message);
  }
}

/**
 * Authentication error (HTTP 401).
 */
export class UnauthorizedError extends AppError {
  /**
   * Initializes UnauthorizedError with 401 status.
   *
   * @param {string} [message='Unauthorized'] Error message
   */
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/**
 * Authorization error (HTTP 403).
 */
export class ForbiddenError extends AppError {
  /**
   * Initializes ForbiddenError with 403 status.
   *
   * @param {string} [message='Forbidden'] Error message
   */
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

/**
 * Resource not found error (HTTP 404).
 */
export class NotFoundError extends AppError {
  /**
   * Initializes NotFoundError with 404 status.
   *
   * @param {string} [message='Resource not found'] Error message
   */
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}
