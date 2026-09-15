import { z } from 'zod';
import { AuthorProfile } from '../repositories/IArticleRepository';

export const CreateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    body: z.string().min(1, 'Body is required'),
    tagList: z.array(z.string()).optional().default([]),
  }),
});

export const UpdateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
  }),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>['article'];
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>['article'];

export interface ArticleResponseData {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorProfile;
}

export interface SingleArticleResponseDTO {
  article: ArticleResponseData;
}

export interface MultipleArticlesResponseDTO {
  articles: Omit<ArticleResponseData, 'body'>[];
  articlesCount: number;
}
