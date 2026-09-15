import { z } from '../validation/validate';

/**
 * Create-article request schema.
 */
export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional(),
  }),
});

/**
 * Update-article request schema. All fields optional.
 */
export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank").optional(),
    description: z.string().min(1, "can't be blank").optional(),
    body: z.string().min(1, "can't be blank").optional(),
  }),
});

/**
 * Create-comment request schema.
 */
export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank"),
  }),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
