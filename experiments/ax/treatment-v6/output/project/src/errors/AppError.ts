/**
 * Base application error class.
 * All domain errors extend this class to ensure consistent error handling.
 * Domain code never returns HTTP status codes — the API layer maps these.
 */
export class AppError extends Error {
  /** Machine-readable error code for programmatic handling. */
  public readonly code: string;
  /** ISO timestamp of when the error occurred. */
  public readonly timestamp: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Thrown when a requested resource cannot be found. Maps to HTTP 404. */
export class NotFoundError extends AppError {
  /** The resource type that was not found (e.g. "User", "Article"). */
  public readonly resourceType: string;
  /** The identifier used in the lookup. */
  public readonly resourceId: string;

  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} not found: ${resourceId}`, 'NOT_FOUND');
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/** Thrown when a request lacks valid authentication credentials. Maps to HTTP 401. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED');
  }
}

/** Thrown when an authenticated user lacks permission for an action. Maps to HTTP 403. */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: insufficient permissions') {
    super(message, 'FORBIDDEN');
  }
}

/** Thrown when request input fails validation. Maps to HTTP 422. */
export class ValidationError extends AppError {
  /** Validation error messages by field. */
  public readonly fieldErrors: Readonly<Record<string, ReadonlyArray<string>>>;

  constructor(fieldErrors: Record<string, string[]>) {
    super('Validation failed', 'VALIDATION_ERROR');
    this.fieldErrors = fieldErrors;
  }
}

/** Thrown when a resource already exists (e.g. duplicate email). Maps to HTTP 422. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}
