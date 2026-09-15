import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'is required'),
    description: z.string().min(1, 'is required'),
    body: z.string().min(1, 'is required'),
    tagList: z.array(z.string()).optional()
  })
});

export const updateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      tagList: z.array(z.string()).optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required'
    })
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>['article'];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['article'];
