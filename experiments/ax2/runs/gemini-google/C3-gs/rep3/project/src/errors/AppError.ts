// src/errors/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errors?: Record<string, string[]>) {
    super(404, message, errors || { body: [message] });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errors?: Record<string, string[]>) {
    super(401, message, errors || { body: [message] });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errors?: Record<string, string[]>) {
    super(403, message, errors || { body: [message] });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: Record<string, string[]>) {
    super(422, message, errors || { body: [message] });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errors?: Record<string, string[]>) {
    super(409, message, errors || { body: [message] });
  }
}
