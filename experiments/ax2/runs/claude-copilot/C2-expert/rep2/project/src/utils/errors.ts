/**
 * Domain error hierarchy. Each error carries an HTTP status and a list of
 * human-readable messages so the API layer can render the RealWorld
 * `{ errors: { body: [...] } }` envelope without leaking framework concerns.
 */
export class DomainError extends Error {
  readonly status: number;
  readonly messages: readonly string[];

  constructor(status: number, messages: string[]) {
    super(messages.join('; '));
    this.name = new.target.name;
    this.status = status;
    this.messages = messages;
  }
}

export class ValidationError extends DomainError {
  constructor(messages: string[]) {
    super(422, messages);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'unauthorized') {
    super(401, [message]);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'forbidden') {
    super(403, [message]);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'not found') {
    super(404, [message]);
  }
}
