import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional().default([]),
  }),
});

export const updateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1, "can't be blank").optional(),
      description: z.string().min(1, "can't be blank").optional(),
      body: z.string().min(1, "can't be blank").optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "can't be blank",
    }),
});

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank"),
  }),
});

export type CreateArticleRequest = z.infer<typeof createArticleSchema>;
export type UpdateArticleRequest = z.infer<typeof updateArticleSchema>;
export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
