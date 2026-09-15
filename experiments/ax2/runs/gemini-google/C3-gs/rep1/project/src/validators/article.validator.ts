import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'title is required'),
    description: z.string().min(1, 'description is required'),
    body: z.string().min(1, 'body is required'),
    tagList: z.array(z.string()).optional().default([]),
  }),
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
  }),
});

export const articleQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const articleFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>['article'];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['article'];
export type ArticleQueryParams = z.infer<typeof articleQuerySchema>;
export type ArticleFeedQueryParams = z.infer<typeof articleFeedQuerySchema>;
