import { ZodError } from 'zod';
import { ValidationError } from '../lib/errors';

/**
 * Converts a ZodError into the RealWorld validation message list.
 * @param error the ZodError produced by a failed parse
 * @returns human-readable "<field> <message>" strings
 */
export function formatZodError(error: ZodError): string[] {
  return error.errors.map((issue) => {
    const field = issue.path.join('.');
    return field ? `${field} ${issue.message}` : issue.message;
  });
}

/**
 * Parses input against a Zod schema, throwing a {@link ValidationError} on failure.
 * @param schema the Zod schema exposing safeParse
 * @param input the raw input to validate
 * @returns the parsed, typed value
 * @throws ValidationError when parsing fails
 */
export function parseOrThrow<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: ZodError } },
  input: unknown
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error as ZodError));
  }
  return result.data as T;
}
