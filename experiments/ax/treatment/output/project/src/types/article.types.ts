import { ProfileResponse } from './profile.types';

/**
 * Article response DTO (single article, includes body).
 */
export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileResponse;
}

/**
 * Article list item DTO (excludes body field per 2024-08-16 spec).
 */
export interface ArticleListItem {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileResponse;
}

/**
 * Multiple articles response DTO.
 */
export interface MultipleArticlesResponse {
  articles: ArticleListItem[];
  articlesCount: number;
}

/**
 * Create article DTO.
 */
export interface CreateArticleDTO {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

/**
 * Update article DTO.
 */
export interface UpdateArticleDTO {
  title?: string;
  description?: string;
  body?: string;
}

/**
 * Article query filters.
 */
export interface ArticleQueryFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}
