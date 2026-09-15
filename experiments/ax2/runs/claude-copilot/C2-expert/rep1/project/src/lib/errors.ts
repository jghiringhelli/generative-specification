/**
 * Domain-level error hierarchy. Domain code never returns HTTP status codes;
 * the API error middleware maps these to responses.
 */

/** Base class for all application errors carrying an HTTP status. */
export class AppError extends Error {
  /**
   * @param message human-readable message surfaced in the error body
   * @param status HTTP status the API layer should emit
   */
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = new.target.name;
  }
}

/** Raised when validation of a request body fails (HTTP 422). */
export class ValidationError extends AppError {
  /**
   * @param messages list of human-readable validation messages
   */
  constructor(public readonly messages: string[]) {
    super(messages.join(', '), 422);
  }
}

/** Raised when authentication is required or invalid (HTTP 401). */
export class UnauthorizedError extends AppError {
  /** @param message optional custom message */
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/** Raised when an authenticated user lacks permission (HTTP 403). */
export class ForbiddenError extends AppError {
  /** @param message optional custom message */
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/** Raised when a resource cannot be found (HTTP 404). */
export class NotFoundError extends AppError {
  /** @param message optional custom message */
  constructor(message = 'Not found') {
    super(message, 404);
  }
}
