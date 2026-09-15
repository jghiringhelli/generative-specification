/**
 * Base class for domain errors that map to a specific HTTP status code and to
 * the RealWorld error envelope `{ "errors": { "body": ["..."] } }`.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(', '));
    this.status = status;
    this.messages = messages;
    this.name = new.target.name;
  }
}

/** Raised when request input fails validation (HTTP 422). */
export class ValidationError extends AppError {
  constructor(messages: string[]) {
    super(422, messages);
  }
}

/** Raised when authentication is missing or invalid (HTTP 401). */
export class UnauthorizedError extends AppError {
  constructor(message = 'unauthorized') {
    super(401, [message]);
  }
}

/** Raised when the authenticated user lacks permission (HTTP 403). */
export class ForbiddenError extends AppError {
  constructor(message = 'forbidden') {
    super(403, [message]);
  }
}

/** Raised when a requested resource cannot be found (HTTP 404). */
export class NotFoundError extends AppError {
  constructor(message = 'not found') {
    super(404, [message]);
  }
}
