/**
 * Application error hierarchy.
 *
 * Domain and service layers throw these; a single HTTP error-mapping middleware
 * translates them to RealWorld error envelopes. Errors carry an HTTP status and
 * a machine-readable code, but the domain itself never imports HTTP types — the
 * status is metadata the boundary consumes.
 */

/** Field → list of human-readable problems, e.g. `{ email: ['is invalid'] }`. */
export type ErrorEnvelope = Readonly<Record<string, ReadonlyArray<string>>>;

/** Base for all expected, operational application errors. */
export abstract class AppError extends Error {
  /** HTTP status the boundary should map this error to. */
  abstract readonly statusCode: number;
  /** Stable machine-readable code for clients/logs. */
  abstract readonly code: string;
  /** True for errors that are part of normal control flow (vs. bugs). */
  readonly isOperational = true;
  /** Resource-scoped RealWorld error envelope, or undefined to fall back to `body`. */
  private readonly envelope: ErrorEnvelope | undefined;

  protected constructor(message: string, envelope?: ErrorEnvelope) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, new.target);
    this.envelope = envelope;
  }

  /**
   * The RealWorld error body (`field → messages`) this error renders to.
   * Defaults to `{ body: [message] }` when no resource-scoped envelope was given.
   */
  get errors(): ErrorEnvelope {
    return this.envelope ?? { body: [this.message] };
  }
}

/** Requested resource does not exist. → 404 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'not_found';

  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} '${identifier}' not found` : `${resource} not found`, {
      [resource.toLowerCase()]: ['not found'],
    });
  }
}

/**
 * Caller is unauthenticated or presented an invalid/expired credential. → 401
 *
 * `envelope` resource-scopes the body (e.g. `{ token: ['is missing'] }` at the
 * auth seam, `{ credentials: ['invalid'] }` on a bad login).
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'unauthorized';

  constructor(message = 'Authentication required', envelope?: ErrorEnvelope) {
    super(message, envelope);
  }
}

/**
 * Caller is authenticated but not permitted to perform the action. → 403
 *
 * `envelope` resource-scopes the body (e.g. `{ article: ['forbidden'] }`).
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'forbidden';

  constructor(message = 'You do not have permission to perform this action', envelope?: ErrorEnvelope) {
    super(message, envelope);
  }
}

/** Input failed validation. Carries per-field messages (RealWorld envelope). → 422 */
export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly code = 'validation_error';
  /** Field → list of human-readable problems, e.g. `{ email: ['is invalid'] }`. */
  readonly fields: ErrorEnvelope;

  constructor(fields: ErrorEnvelope, message = 'Validation failed') {
    super(message, fields);
    this.fields = fields;
  }
}

/**
 * Request conflicts with current state (e.g. duplicate email/username). → 409
 *
 * `envelope` resource-scopes the body (e.g. `{ email: ['has already been taken'] }`).
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'conflict';

  constructor(message: string, envelope?: ErrorEnvelope) {
    super(message, envelope);
  }
}
