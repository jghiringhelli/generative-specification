export class AppError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: Readonly<Record<string, ReadonlyArray<string>>>,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace(this, new.target);
  }
}

export class NotFoundError extends AppError {
  public constructor(message: string) {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  public constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  public constructor(message = 'Operation forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  public constructor(details: Readonly<Record<string, ReadonlyArray<string>>>) {
    super('Validation failed', 422, details);
  }
}

export class ConflictError extends AppError {
  public constructor(message: string) {
    super(message, 422);
  }
}
