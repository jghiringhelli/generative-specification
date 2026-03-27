/**
 * Base application error class.
 *
 * All domain and application errors extend this class.
 * Carries `statusCode` for HTTP response mapping and `resource` for
 * resource-scoped error envelope construction per the Conduit contract:
 *   { errors: { [resource]: [message] } }
 *
 * Error handlers in the API layer read these properties to build responses.
 * Domain code never constructs HTTP responses — it throws typed errors.
 */
export class AppError extends Error {
  /** HTTP status code this error maps to. */
  readonly statusCode: number;

  /**
   * The domain resource associated with this error.
   * Used as the key in the Conduit error envelope: `{ errors: { [resource]: [...] } }`.
   * Examples: 'user', 'article', 'comment', 'profile'.
   */
  readonly resource: string;

  constructor(message: string, statusCode: number, resource: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.resource = resource;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when a requested resource cannot be found.
 * Maps to HTTP 404.
 * Error envelope: `{ errors: { [resource]: ["not found"] } }`
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('not found', 404, resource);
  }
}

/**
 * Thrown when a request lacks valid or present authentication credentials.
 * Maps to HTTP 401.
 * Error envelope: `{ errors: { user: ["Unauthorized"] } }`
 */
export class UnauthorizedError extends AppError {
  constructor(resource = 'token') {
    super('is missing', 401, resource);
  }
}

/**
 * Thrown when an authenticated user attempts an operation they are not permitted to perform.
 * Maps to HTTP 403.
 * Error envelope: `{ errors: { [resource]: ["forbidden"] } }`
 */
export class ForbiddenError extends AppError {
  constructor(resource: string) {
    super('forbidden', 403, resource);
  }
}

/**
 * Thrown when input fails domain or schema validation.
 * Maps to HTTP 422.
 * Error envelope: `{ errors: { [fieldName]: ["message", ...] } }` (field-level scoping).
 *
 * `fields` is a map from field name to array of error messages for that field.
 * Example: `{ email: ["can't be blank", "is invalid"], password: ["is too short"] }`
 */
export class ValidationError extends AppError {
  /**
   * Per-field error messages.
   * Keys are field names; values are arrays of one or more error strings.
   */
  readonly fields: Readonly<Record<string, string[]>>;

  constructor(fields: Record<string, string[]>) {
    super('Validation failed', 422, 'validation');
    this.fields = fields;
  }
}

/**
 * Thrown when login credentials are invalid (wrong email or password).
 * Maps to HTTP 401.
 * Error envelope: `{ errors: { credentials: ["invalid"] } }`
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super('invalid', 401, 'credentials');
  }
}

/**
 * Thrown when a create or update operation conflicts with existing state
 * (e.g. duplicate email address or duplicate username).
 * Maps to HTTP 409.
 * Error envelope: `{ errors: { [resource]: [message] } }`
 */
export class ConflictError extends AppError {
  constructor(resource: string, message: string) {
    super(message, 409, resource);
  }
}
