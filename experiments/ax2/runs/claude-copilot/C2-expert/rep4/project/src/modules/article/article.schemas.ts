import { z } from "zod";
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from "../../config";

/** Zod schema for creating an article. */
export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional(),
  }),
});

/** Zod schema for updating an article. */
export const updateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1, "can't be blank").optional(),
      description: z.string().min(1, "can't be blank").optional(),
      body: z.string().min(1, "can't be blank").optional(),
      tagList: z.array(z.string()).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "can't be empty",
    }),
});

const nonNegativeInt = z
  .preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    z.number().int("must be an integer").nonnegative("must be non-negative"),
  );

/** Zod schema for list/feed pagination and filter query params. */
export const listQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: nonNegativeInt.optional().default(DEFAULT_LIMIT),
  offset: nonNegativeInt.optional().default(DEFAULT_OFFSET),
});

/** Zod schema for feed pagination query params. */
export const feedQuerySchema = z.object({
  limit: nonNegativeInt.optional().default(DEFAULT_LIMIT),
  offset: nonNegativeInt.optional().default(DEFAULT_OFFSET),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>["article"];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>["article"];
export type ListQuery = z.infer<typeof listQuerySchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
