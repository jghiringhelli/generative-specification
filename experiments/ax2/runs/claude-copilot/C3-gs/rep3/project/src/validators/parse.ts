import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Parse input against a Zod schema, converting failures into a domain
 * {@link ValidationError} carrying per-field messages.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : 'body';
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(issue.message);
  }
  throw new ValidationError(errors);
}
