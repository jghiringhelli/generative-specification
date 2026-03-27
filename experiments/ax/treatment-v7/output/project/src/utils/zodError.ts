import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Convert a Zod parse error into a domain `ValidationError` with field-level scoping.
 *
 * Maps each Zod issue's terminal path segment to a field key and collects
 * messages per field — matching the Conduit error envelope format:
 *   `{ errors: { fieldName: ["message", ...] } }`
 *
 * @param error - The ZodError to convert
 * @returns A `ValidationError` whose `fields` map matches the Conduit error envelope
 */
export function zodToValidationError(error: z.ZodError): ValidationError {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = (issue.path[issue.path.length - 1] as string | undefined) ?? 'input';
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }
  return new ValidationError(fields);
}
