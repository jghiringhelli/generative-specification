import { z } from 'zod';

export const DEFAULT_ARTICLE_LIMIT = 20;
export const DEFAULT_ARTICLE_OFFSET = 0;

const paginationValue = z.coerce.number().int().nonnegative();

export const listArticlesSchema = z.object({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
  limit: paginationValue.default(DEFAULT_ARTICLE_LIMIT),
  offset: paginationValue.default(DEFAULT_ARTICLE_OFFSET),
});

export const articleInputSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string().min(1)).default([]),
  }),
});

export const articleUpdateSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    tagList: z.array(z.string().min(1)).optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

export type ArticleInput = z.infer<typeof articleInputSchema>['article'];
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>['article'];
export type ListArticlesInput = z.infer<typeof listArticlesSchema>;
