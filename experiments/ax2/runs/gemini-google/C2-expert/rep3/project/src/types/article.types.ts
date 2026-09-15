import { ProfileResponseDto } from './auth.types';

/**
 * Full article response representation.
 */
export interface ArticleResponseDto {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileResponseDto;
}

/**
 * Article list response container.
 */
export interface ArticleListResponseDto {
  articles: ArticleResponseDto[];
  articlesCount: number;
}
