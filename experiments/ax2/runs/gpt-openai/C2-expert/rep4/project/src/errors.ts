export class AppError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly field = "body"
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  public constructor(message: string) {
    super(message, 422);
  }
}

export class UnauthorizedError extends AppError {
  public constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  public constructor(message: string) {
    super(message, 404);
  }
}
