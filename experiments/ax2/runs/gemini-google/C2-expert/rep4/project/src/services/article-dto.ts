import { z } from 'zod';
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_OFFSET,
} from '../config/constants';

export const CreateArticleInputSchema = z.object({
  article: z.object({
    title: z.string().trim().min(1, 'Title cannot be empty'),
    description: z.string().trim().min(1, 'Description cannot be empty'),
    body: z.string().trim().min(1, 'Body cannot be empty'),
    tagList: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const UpdateArticleInputSchema = z.object({
  article: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    tagList: z.array(z.string().trim().min(1)).optional(),
  }),
});

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().nonnegative().optional().default(DEFAULT_PAGE_LIMIT),
  offset: z.coerce.number().int().nonnegative().optional().default(DEFAULT_PAGE_OFFSET),
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleInputSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface ArticleAuthorDto {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface SingleArticleDto {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ArticleAuthorDto;
}

export interface ListItemArticleDto {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tagList: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ArticleAuthorDto;
}

export interface ArticleListResponseData {
  readonly articles: readonly ListItemArticleDto[];
  readonly articlesCount: number;
}
