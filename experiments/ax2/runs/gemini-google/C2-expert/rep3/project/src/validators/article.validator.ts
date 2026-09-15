import { z } from 'zod';
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from '../config/constants';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string({ required_error: 'title is required' }).min(1, 'title cannot be empty'),
    description: z.string({ required_error: 'description is required' }).min(1, 'description cannot be empty'),
    body: z.string({ required_error: 'body is required' }).min(1, 'body cannot be empty'),
    tagList: z.array(z.string()).optional(),
  }),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>['article'];

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'title cannot be empty').optional(),
    description: z.string().min(1, 'description cannot be empty').optional(),
    body: z.string().min(1, 'body cannot be empty').optional(),
    tagList: z.array(z.string()).optional(),
  }),
});

export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['article'];

export const listArticlesQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int('limit must be an integer').min(0, 'limit must be non-negative').default(DEFAULT_PAGE_LIMIT),
  offset: z.coerce.number().int('offset must be an integer').min(0, 'offset must be non-negative').default(DEFAULT_PAGE_OFFSET),
});

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

export const feedArticlesQuerySchema = z.object({
  limit: z.coerce.number().int('limit must be an integer').min(0, 'limit must be non-negative').default(DEFAULT_PAGE_LIMIT),
  offset: z.coerce.number().int('offset must be an integer').min(0, 'offset must be non-negative').default(DEFAULT_PAGE_OFFSET),
});

export type FeedArticlesQuery = z.infer<typeof feedArticlesQuerySchema>;
