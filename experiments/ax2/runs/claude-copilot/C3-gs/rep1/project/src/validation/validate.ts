import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Parse input against a Zod schema, converting failures to a ValidationError
 * shaped for the Conduit error envelope.
 * @param schema - The Zod schema to validate against.
 * @param input - The raw input to validate.
 * @returns The parsed, typed value.
 */
export function validate<T>(schema: ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(toFieldErrors(error));
    }
    throw error;
  }
}

/**
 * Convert a ZodError into a field-keyed message map.
 * @param error - The Zod error.
 * @returns Map of field name to messages.
 */
function toFieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : 'body';
    if (!fields[key]) {
      fields[key] = [];
    }
    fields[key].push(issue.message);
  }
  return fields;
}

export { z };
