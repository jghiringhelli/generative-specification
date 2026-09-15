export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors || { body: [message] };
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, { body: [message] });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(401, message, { body: [message] });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Action forbidden') {
    super(403, message, { body: [message] });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(422, message, errors || { body: [message] });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(409, message, { body: [message] });
  }
}
