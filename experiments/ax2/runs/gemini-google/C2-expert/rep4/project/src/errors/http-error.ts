/**
 * Base class for HTTP application errors.
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly messages: readonly string[];

  /**
   * Constructs an HttpError.
   *
   * @param {number} statusCode - HTTP status code
   * @param {string | readonly string[]} messages - Error message(s)
   */
  constructor(statusCode: number, messages: string | readonly string[]) {
    const messageList = Array.isArray(messages) ? messages : [messages];
    super(messageList[0]);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.messages = messageList;
  }
}

/**
 * Error representing an unprocessable entity or validation error (HTTP 422).
 */
export class ValidationError extends HttpError {
  /**
   * Constructs a ValidationError.
   *
   * @param {string | readonly string[]} messages - Validation error message(s)
   */
  constructor(messages: string | readonly string[]) {
    super(422, messages);
    this.name = 'ValidationError';
  }
}

/**
 * Error representing unauthorized access (HTTP 401).
 */
export class UnauthorizedError extends HttpError {
  /**
   * Constructs an UnauthorizedError.
   *
   * @param {string} [message='Authentication required'] - Error message
   */
  constructor(message = 'Authentication required') {
    super(401, [message]);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error representing forbidden access (HTTP 403).
 */
export class ForbiddenError extends HttpError {
  /**
   * Constructs a ForbiddenError.
   *
   * @param {string} [message='Forbidden resource'] - Error message
   */
  constructor(message = 'Forbidden resource') {
    super(403, [message]);
    this.name = 'ForbiddenError';
  }
}

/**
 * Error representing a not found resource (HTTP 404).
 */
export class NotFoundError extends HttpError {
  /**
   * Constructs a NotFoundError.
   *
   * @param {string} [message='Resource not found'] - Error message
   */
  constructor(message = 'Resource not found') {
    super(404, [message]);
    this.name = 'NotFoundError';
  }
}
