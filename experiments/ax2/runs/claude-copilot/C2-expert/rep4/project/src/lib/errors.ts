/**
 * Application-wide error hierarchy. Domain and service layers throw these;
 * the error-handling middleware maps them to HTTP responses.
 */

/** Base class carrying an HTTP status code and spec-formatted messages. */
export class AppError extends Error {
  public readonly status: number;
  public readonly messages: string[];

  /**
   * @param status HTTP status code to return.
   * @param messages Human-readable error messages for the response body.
   */
  constructor(status: number, messages: string[]) {
    super(messages.join(", "));
    this.status = status;
    this.messages = messages;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 422 — request failed validation or a business rule. */
export class ValidationError extends AppError {
  /**
   * @param messages Validation failure messages.
   */
  constructor(messages: string[]) {
    super(422, messages);
  }
}

/** 401 — authentication is missing or invalid. */
export class UnauthorizedError extends AppError {
  /**
   * @param message Reason authentication failed.
   */
  constructor(message = "unauthorized") {
    super(401, [message]);
  }
}

/** 403 — authenticated but not permitted to perform the action. */
export class ForbiddenError extends AppError {
  /**
   * @param message Reason the action is forbidden.
   */
  constructor(message = "forbidden") {
    super(403, [message]);
  }
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends AppError {
  /**
   * @param message Reason the resource was not found.
   */
  constructor(message = "not found") {
    super(404, [message]);
  }
}
