/**
 * Application error hierarchy. Domain and service layers throw these; the API
 * error-handling adapter maps them to HTTP status codes and the RealWorld error
 * envelope. Errors never carry HTTP concerns themselves beyond a status hint.
 */

export type ErrorBody = Record<string, string[]>;

export abstract class AppError extends Error {
  /** HTTP status hint consumed by the error-handling adapter. */
  public readonly statusCode: number;

  /** Field-keyed messages rendered as { errors: { <field>: [...] } }. */
  public readonly body: ErrorBody;

  protected constructor(statusCode: number, message: string, body?: ErrorBody) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.body = body ?? { body: [message] };
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'validation failed', body?: ErrorBody) {
    super(422, message, body);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'unauthorized', body?: ErrorBody) {
    super(401, message, body ?? { body: [message] });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'forbidden', body?: ErrorBody) {
    super(403, message, body ?? { body: [message] });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'not found', body?: ErrorBody) {
    super(404, message, body ?? { body: [message] });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'conflict', body?: ErrorBody) {
    super(409, message, body ?? { body: [message] });
  }
}
