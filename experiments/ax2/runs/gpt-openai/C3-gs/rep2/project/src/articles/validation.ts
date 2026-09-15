import { z } from 'zod';

const pagination = z.object({
  limit: z.coerce.number().int().min(0).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const articleListQuerySchema = pagination.extend({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
});

export const feedQuerySchema = pagination;

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string().min(1)).default([]),
  }),
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});
