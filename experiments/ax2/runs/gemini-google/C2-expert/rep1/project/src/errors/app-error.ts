export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public readonly messages: string[];

  constructor(messages: string | string[], message?: string) {
    const list = Array.isArray(messages) ? messages : [messages];
    super(message || list[0] || 'Application error');
    this.messages = list;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 422;

  constructor(messages: string | string[]) {
    super(messages, 'Validation failed');
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message, message);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message, message);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;

  constructor(message = 'Resource not found') {
    super(message, message);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 422;

  constructor(message: string) {
    super(message, message);
  }
}
