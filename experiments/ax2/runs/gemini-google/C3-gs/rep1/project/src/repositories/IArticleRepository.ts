// src/repositories/IArticleRepository.ts

export interface ArticleEntity {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export interface ArticleQueryOptions {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

export interface ArticleFeedOptions {
  limit?: number;
  offset?: number;
}

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
  authorId: string;
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
}

export interface IArticleRepository {
  findBySlug(slug: string): Promise<ArticleEntity | null>;
  list(options: ArticleQueryOptions): Promise<{ articles: ArticleEntity[]; articlesCount: number }>;
  listFeed(userId: string, options: ArticleFeedOptions): Promise<{ articles: ArticleEntity[]; articlesCount: number }>;
  create(data: CreateArticleData): Promise<ArticleEntity>;
  update(slug: string, data: UpdateArticleData): Promise<ArticleEntity>;
  delete(slug: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<void>;
  unfavorite(articleId: string, userId: string): Promise<void>;
  isFavorited(articleId: string, userId: string): Promise<boolean>;
  getFavoritesCount(articleId: string): Promise<number>;
}
