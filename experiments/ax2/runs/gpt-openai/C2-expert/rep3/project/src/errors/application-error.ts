export class ApplicationError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly field: string = 'body',
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
