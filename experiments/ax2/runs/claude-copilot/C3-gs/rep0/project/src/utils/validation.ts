import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Parse a value against a Zod schema, converting failures into the Conduit
 * `ValidationError` (HTTP 422) with a field-keyed message map.
 * @param schema - The Zod schema.
 * @param data - The raw input to validate.
 * @returns The parsed, typed value.
 * @throws ValidationError when validation fails.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : 'body';
    (fields[key] ??= []).push(issue.message);
  }
  throw new ValidationError(fields);
}
