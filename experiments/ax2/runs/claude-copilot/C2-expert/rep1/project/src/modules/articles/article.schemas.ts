import { z } from 'zod';

/** Zod schema for creating an article. */
export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'is required'),
    description: z.string().min(1, 'is required'),
    body: z.string().min(1, 'is required'),
    tagList: z.array(z.string()).optional()
  })
});

/** Zod schema for updating an article. All fields optional. */
export const updateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1, 'is required').optional(),
      description: z.string().min(1, 'is required').optional(),
      body: z.string().min(1, 'is required').optional(),
      tagList: z.array(z.string()).optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required'
    })
});

/** Create-article input DTO. */
export type CreateArticleInput = z.infer<typeof createArticleSchema>['article'];
/** Update-article input DTO. */
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['article'];
