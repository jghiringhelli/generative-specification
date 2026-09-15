export class ApplicationError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details: ReadonlyArray<string> = [message]
  ) {
    super(message);
  }
}

export class ValidationError extends ApplicationError {
  public constructor(message: string) {
    super(message, 422);
  }
}

export class AuthenticationError extends ApplicationError {
  public constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends ApplicationError {
  public constructor(message: string) {
    super(message, 404);
  }
}

export class ForbiddenError extends ApplicationError {
  public constructor(message = "Forbidden") {
    super(message, 403);
  }
}
