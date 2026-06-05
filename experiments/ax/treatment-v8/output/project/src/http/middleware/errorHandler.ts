/**
 * Terminal error-mapping middleware: the single place that turns thrown errors
 * into RealWorld error envelopes.
 *
 * - any {@link AppError} → its `statusCode` with `{ errors: <error.errors> }`,
 *   where each error supplies its own RealWorld envelope (resource-scoped fields
 *   such as `{ token: [..] }` / `{ article: [..] }`, defaulting to `{ body: [msg] }`).
 * - anything else → 500 with a generic body (never leak internals; api.md
 *   "no verbose prod errors"). Unexpected errors are reported via the injected
 *   logger so they are observable without a `console.log` in the request path.
 */
import type { ErrorRequestHandler } from 'express';
import { AppError } from '../../errors/AppError.js';

/** Sink for unexpected (non-operational) errors. */
export type ErrorLogger = (error: unknown) => void;

const defaultLogger: ErrorLogger = (error) => {
  console.error('[unhandled]', error);
};

/**
 * Build the error-handling middleware.
 *
 * @param logUnexpected - sink for non-operational errors (default: `console.error`).
 * @returns an Express error handler.
 */
export function createErrorHandler(logUnexpected: ErrorLogger = defaultLogger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ errors: err.errors });
      return;
    }
    logUnexpected(err);
    res.status(500).json({ errors: { body: ['Internal server error'] } });
  };
}
