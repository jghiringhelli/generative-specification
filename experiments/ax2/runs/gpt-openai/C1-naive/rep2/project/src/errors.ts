export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApplicationError {
  constructor(details: Record<string, string[]>) {
    super("Validation failed", 422, details);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}
