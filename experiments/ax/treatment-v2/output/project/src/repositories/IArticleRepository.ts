import { Article } from '@prisma/client';

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList?: string[];
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface IArticleRepository {
  findBySlug(slug: string, currentUserId?: number): Promise<any | null>;
  findById(id: number): Promise<Article | null>;
  findAll(filters: ArticleFilters, currentUserId?: number): Promise<{ articles: any[]; count: number }>;
  findFeed(userId: number, limit: number, offset: number, currentUserId?: number): Promise<{ articles: any[]; count: number }>;
  create(data: CreateArticleData): Promise<any>;
  update(slug: string, data: UpdateArticleData): Promise<any>;
  delete(slug: string): Promise<void>;
  favorite(slug: string, userId: number): Promise<any>;
  unfavorite(slug: string, userId: number): Promise<any>;
}
