import { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Parse a value against a Zod schema, throwing a spec-formatted
 * ValidationError (HTTP 422) when validation fails.
 * @param schema The Zod schema to validate against.
 * @param value The unknown input value.
 * @returns The parsed, typed value.
 */
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const messages = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path} ${issue.message}` : issue.message;
    });
    throw new ValidationError(messages);
  }
  return result.data;
}
