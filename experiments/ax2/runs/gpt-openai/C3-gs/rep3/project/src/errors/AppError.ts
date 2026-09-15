export class AppError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  public constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  public constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  public constructor(message = 'Operation forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  public constructor(message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  public constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}
