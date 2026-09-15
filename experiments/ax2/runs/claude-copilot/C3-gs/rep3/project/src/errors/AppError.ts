/**
 * Base application error and domain-specific subclasses.
 *
 * Domain and service layers throw these; the API error-handling middleware
 * maps them to HTTP status codes and the spec error body shape.
 */
export abstract class AppError extends Error {
  /** HTTP status code the API layer should emit for this error. */
  public readonly statusCode: number;
  /** Field key used in the `{ errors: { <field>: [...] } }` response body. */
  public readonly field: string;

  protected constructor(message: string, statusCode: number, field: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.field = field;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'body');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'body');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'body');
  }
}

export class ValidationError extends AppError {
  /** Per-field validation messages, merged into the response body. */
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422, 'body');
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'body');
  }
}
