
/**
 * Base application error class.
 * All custom errors inherit from this.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to RealWorld API error format.
   */
  toJSON(): { errors: { body: string[] } } {
    return {
      errors: {
        body: [this.message]
      }
    };
  }
}
