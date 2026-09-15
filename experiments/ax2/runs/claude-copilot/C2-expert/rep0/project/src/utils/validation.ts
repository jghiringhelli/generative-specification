import { z } from 'zod';
import { ValidationError } from '../errors';

/**
 * Parses a payload against a Zod schema, converting failures into a
 * {@link ValidationError} carrying human-readable messages.
 * @param schema The Zod schema to validate against.
 * @param payload The raw input to validate.
 * @returns The parsed, typed value.
 * @throws {ValidationError} When validation fails.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => issue.message)
    );
  }
  return result.data;
}
