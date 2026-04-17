import type { ZodError } from 'zod';

/**
 * Extract field-specific errors from a ZodError.
 * Uses the last path segment as the field name (skips wrapper keys like "user", "article").
 */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = (issue.path[issue.path.length - 1] as string) ?? 'body';
    if (!fields[field]) fields[field] = [];
    fields[field].push(issue.message);
  }
  return fields;
}
