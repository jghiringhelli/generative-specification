/**
 * Base class for domain errors carrying an HTTP status and messages
 * conforming to the RealWorld error format `{ errors: { body: [...] } }`.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(', '));
    this.name = 'HttpError';
    this.status = status;
    this.messages = messages;
  }
}

/** 401 Unauthorized. */
export class UnauthorizedError extends HttpError {
  constructor(message = 'unauthorized') {
    super(401, [message]);
    this.name = 'UnauthorizedError';
  }
}

/** 403 Forbidden. */
export class ForbiddenError extends HttpError {
  constructor(message = 'forbidden') {
    super(403, [message]);
    this.name = 'ForbiddenError';
  }
}

/** 404 Not Found. */
export class NotFoundError extends HttpError {
  constructor(message = 'not found') {
    super(404, [message]);
    this.name = 'NotFoundError';
  }
}

/** 422 Unprocessable Entity for validation failures. */
export class ValidationError extends HttpError {
  constructor(messages: string[]) {
    super(422, messages);
    this.name = 'ValidationError';
  }
}
