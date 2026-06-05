/**
 * Shared HTTP-boundary validation helper.
 *
 * Domain-neutral so every feature's schema module can reuse it without a
 * lateral cross-domain import. It parses untrusted input with a Zod schema and,
 * on failure, raises a {@link ValidationError} whose field keys match the
 * RealWorld error envelope — the top-level request wrapper (`user`, `article`)
 * is stripped so a client sees `title`, not `article.title`.
 */
import type { z } from 'zod';
import { ValidationError } from '../errors/AppError.js';

/** Request-envelope keys stripped from error paths so field names stay flat. */
const ENVELOPE_KEYS = new Set(['user', 'article', 'comment']);

/**
 * Parse `data` with `schema`, throwing a {@link ValidationError} on failure.
 *
 * @param schema - the Zod schema to apply.
 * @param data - the untrusted input (typically `req.body` or `req.query`).
 * @returns the parsed, typed value.
 * @throws ValidationError with field-keyed messages (the envelope prefix stripped).
 */
export function parseOrThrow<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data as z.infer<S>;
  }
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.filter((segment) => !ENVELOPE_KEYS.has(String(segment)));
    const key = path.length > 0 ? path.join('.') : 'body';
    (fields[key] ??= []).push(issue.message);
  }
  throw new ValidationError(fields);
}
