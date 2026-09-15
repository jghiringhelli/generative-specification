// src/errors/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors ?? { body: [message] };
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: Record<string, string[]>) {
    super(422, message, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', errors?: Record<string, string[]>) {
    super(422, message, errors);
  }
}
