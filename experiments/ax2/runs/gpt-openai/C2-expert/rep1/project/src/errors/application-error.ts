export class ApplicationError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly bodyErrors: readonly string[]
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApplicationError {
  public constructor(message: string) {
    super(message, 422, [message]);
  }
}

export class UnauthorizedError extends ApplicationError {
  public constructor(message = "Unauthorized") {
    super(message, 401, [message]);
  }
}

export class NotFoundError extends ApplicationError {
  public constructor(message: string) {
    super(message, 404, [message]);
  }
}

export class ForbiddenError extends ApplicationError {
  public constructor(message = "Forbidden") {
    super(message, 403, [message]);
  }
}
