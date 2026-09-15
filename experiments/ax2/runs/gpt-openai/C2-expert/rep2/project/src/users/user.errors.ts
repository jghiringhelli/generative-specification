export class UserValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class UserNotFoundError extends Error {
  public constructor(userId: number) {
    super(`User ${userId} was not found`);
    this.name = 'UserNotFoundError';
  }
}
