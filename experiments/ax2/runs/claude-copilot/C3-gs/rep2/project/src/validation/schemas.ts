import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Parse a value against a Zod schema, converting Zod issues into the
 * application's {@link ValidationError} with the RealWorld field envelope.
 * @param schema - The Zod schema.
 * @param value - The candidate value.
 * @returns The parsed, typed value.
 * @throws ValidationError when parsing fails.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
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

/** Registration request schema. */
export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank"),
    email: z.string().min(1, "can't be blank").email('is invalid'),
    password: z.string().min(1, "can't be blank"),
  }),
});

/** Login request schema. */
export const loginSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank").email('is invalid'),
    password: z.string().min(1, "can't be blank"),
  }),
});

/** Update-user request schema; all fields optional. */
export const updateUserSchema = z.object({
  user: z
    .object({
      email: z.string().email('is invalid').optional(),
      username: z.string().min(1, "can't be blank").optional(),
      password: z.string().min(1, "can't be blank").optional(),
      bio: z.string().optional(),
      image: z.string().optional(),
    })
    .strict(),
});

/** Create-article request schema. */
export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional(),
  }),
});

/** Update-article request schema; all fields optional. */
export const updateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1, "can't be blank").optional(),
      description: z.string().min(1, "can't be blank").optional(),
      body: z.string().min(1, "can't be blank").optional(),
    })
    .strict(),
});

/** Create-comment request schema. */
export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank"),
  }),
});
