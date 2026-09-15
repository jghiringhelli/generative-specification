// src/repositories/IArticleRepository.ts
import { Article, ArticleListItem, ArticleFilterOptions } from '../types';

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface IArticleRepository {
  create(authorId: string, data: CreateArticleData): Promise<Article>;
  findBySlug(slug: string, currentUserId?: string): Promise<Article | null>;
  update(slug: string, authorId: string, data: UpdateArticleData): Promise<Article>;
  delete(slug: string, authorId: string): Promise<void>;
  findMany(options: ArticleFilterOptions, currentUserId?: string): Promise<{ articles: ArticleListItem[]; articlesCount: number }>;
  findFeed(userId: string, options: { limit?: number; offset?: number }): Promise<{ articles: ArticleListItem[]; articlesCount: number }>;
  favorite(userId: string, slug: string): Promise<Article>;
  unfavorite(userId: string, slug: string): Promise<Article>;
}
