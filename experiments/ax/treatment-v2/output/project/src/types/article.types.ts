import { z } from 'zod';

/**
 * Request DTOs with Zod validation schemas
 */

export const CreateArticleRequestSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional().default([]),
  }),
});

export const UpdateArticleRequestSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank").optional(),
    description: z.string().min(1, "can't be blank").optional(),
    body: z.string().min(1, "can't be blank").optional(),
  }),
});

export type CreateArticleRequest = z.infer<typeof CreateArticleRequestSchema>;
export type UpdateArticleRequest = z.infer<typeof UpdateArticleRequestSchema>;

/**
 * Response DTOs
 */

export interface ArticleAuthor {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleDto {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthor;
}

export interface ArticleListItemDto {
  slug: string;
  title: string;
  description: string;
  // Note: body field NOT included in list responses
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthor;
}

export interface SingleArticleResponse {
  article: ArticleDto;
}

export interface MultipleArticlesResponse {
  articles: ArticleListItemDto[];
  articlesCount: number;
}
