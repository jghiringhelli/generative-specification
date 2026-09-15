export class HttpError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors || { body: [message] };
  }
}

export function unauthorized(message = 'Unauthorized'): HttpError {
  return new HttpError(401, message, { body: [message] });
}

export function forbidden(message = 'Forbidden'): HttpError {
  return new HttpError(403, message, { body: [message] });
}

export function notFound(message = 'Not Found'): HttpError {
  return new HttpError(404, message, { body: [message] });
}

export function unprocessable(errors: Record<string, string[]>): HttpError {
  return new HttpError(422, 'Validation failed', errors);
}
