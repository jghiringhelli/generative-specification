export class AppError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace(this, new.target);
  }
}

export class NotFoundError extends AppError {
  public constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class UnauthorizedError extends AppError {
  public constructor(message = 'Authentication required', details?: Readonly<Record<string, unknown>>) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  public constructor(message = 'Operation forbidden', details?: Readonly<Record<string, unknown>>) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ValidationError extends AppError {
  public constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  public constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(message, 409, 'CONFLICT', details);
  }
}
