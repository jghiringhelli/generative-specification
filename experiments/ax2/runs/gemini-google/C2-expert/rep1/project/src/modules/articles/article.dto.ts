import { z } from 'zod';
import { ProfileData } from '../profiles/profile.dto';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'title is required'),
    description: z.string().min(1, 'description is required'),
    body: z.string().min(1, 'body is required'),
    tagList: z.array(z.string()).optional().default([])
  })
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'title cannot be empty').optional(),
    description: z.string().min(1, 'description cannot be empty').optional(),
    body: z.string().min(1, 'body cannot be empty').optional(),
    tagList: z.array(z.string()).optional()
  })
});

export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export const articlesQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int('limit must be an integer').min(0, 'limit cannot be negative').default(20),
  offset: z.coerce.number().int('offset must be an integer').min(0, 'offset cannot be negative').default(0)
});

export type ArticlesQuery = z.infer<typeof articlesQuerySchema>;

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int('limit must be an integer').min(0, 'limit cannot be negative').default(20),
  offset: z.coerce.number().int('offset must be an integer').min(0, 'offset cannot be negative').default(0)
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;

export interface ArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileData;
}

export interface ArticleListItemData {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileData;
}

export interface SingleArticleResponse {
  article: ArticleData;
}

export interface ArticlesListResponse {
  articles: ArticleListItemData[];
  articlesCount: number;
}
