import { z, ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Validate unknown input against a schema, throwing a {@link ValidationError}
 * shaped as the RealWorld error envelope on failure.
 * @param schema the zod schema to apply.
 * @param data the raw, untrusted input.
 * @returns the parsed, typed value.
 */
export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const body: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.length > 0 ? issue.path.join('.') : 'body';
        (body[key] ??= []).push(issue.message);
      }
      throw new ValidationError('validation failed', body);
    }
    throw error;
  }
}

const nonEmpty = z.string().trim().min(1);

export const registerSchema = z.object({
  user: z.object({
    username: nonEmpty,
    email: nonEmpty.email('is invalid'),
    password: z.string().min(1),
  }),
});

export const loginSchema = z.object({
  user: z.object({
    email: nonEmpty.email('is invalid'),
    password: z.string().min(1),
  }),
});

export const updateUserSchema = z.object({
  user: z
    .object({
      email: nonEmpty.email('is invalid').optional(),
      username: nonEmpty.optional(),
      password: z.string().min(1).optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required',
    }),
});

export const createArticleSchema = z.object({
  article: z.object({
    title: nonEmpty,
    description: nonEmpty,
    body: nonEmpty,
    tagList: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const updateArticleSchema = z.object({
  article: z
    .object({
      title: nonEmpty.optional(),
      description: nonEmpty.optional(),
      body: nonEmpty.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required',
    }),
});

export const addCommentSchema = z.object({
  comment: z.object({
    body: nonEmpty,
  }),
});
