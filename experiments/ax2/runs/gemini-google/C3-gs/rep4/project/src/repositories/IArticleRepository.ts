import { ArticleEntity, ArticleQueryFilters } from '../types';

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
}

export interface IArticleRepository {
  findBySlug(slug: string, currentUserId?: string): Promise<ArticleEntity | null>;
  findMany(filters: ArticleQueryFilters, currentUserId?: string): Promise<{ articles: ArticleEntity[]; articlesCount: number }>;
  findFeed(userId: string, limit?: number, offset?: number): Promise<{ articles: ArticleEntity[]; articlesCount: number }>;
  create(authorId: string, data: CreateArticleData): Promise<ArticleEntity>;
  update(slug: string, data: UpdateArticleData): Promise<ArticleEntity>;
  delete(slug: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<ArticleEntity>;
  unfavorite(articleId: string, userId: string): Promise<ArticleEntity>;
}
