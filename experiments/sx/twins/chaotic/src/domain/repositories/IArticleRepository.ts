import { Article } from '../entities/Article';

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
}

export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleFilters {
  tag?: string;
  authorId?: number;
  favoritedByUserId?: number;
}

export interface IArticleRepository {
  create(data: CreateArticleData): Promise<Article>;
  findBySlug(slug: string): Promise<Article | null>;
  findMany(filters: ArticleFilters, limit: number, offset: number): Promise<Article[]>;
  count(filters: ArticleFilters): Promise<number>;
  findFeed(followingIds: number[], limit: number, offset: number): Promise<Article[]>;
  countFeed(followingIds: number[]): Promise<number>;
  update(slug: string, data: UpdateArticleData): Promise<Article>;
  delete(slug: string): Promise<void>;
  addTag(articleId: number, tagName: string): Promise<void>;
  removeTags(articleId: number): Promise<void>;
  getTags(articleId: number): Promise<string[]>;
  isFavorited(articleId: number, userId: number): Promise<boolean>;
  getFavoritesCount(articleId: number): Promise<number>;
  favorite(articleId: number, userId: number): Promise<void>;
  unfavorite(articleId: number, userId: number): Promise<void>;
}
