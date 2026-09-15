// src/errors/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors ?? { body: [message] };
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, { body: [message] });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(401, message, { body: [message] });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden action') {
    super(403, message, { body: [message] });
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]> | string) {
    if (typeof errors === 'string') {
      super(422, errors, { body: [errors] });
    } else {
      super(422, 'Validation failed', errors);
    }
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(409, message, { body: [message] });
    this.name = 'ConflictError';
  }
}
