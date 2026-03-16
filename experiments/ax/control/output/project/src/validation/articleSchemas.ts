import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    body: z.string().min(1, 'Body is required'),
    tagList: z.array(z.string()).optional().default([])
  })
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    body: z.string().min(1, 'Body cannot be empty').optional()
  })
});

export const queryFiltersSchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type QueryFilters = z.infer<typeof queryFiltersSchema>;
