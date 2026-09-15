// src/repositories/IArticleRepository.ts

export interface ArticleAuthor {
  id: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface ArticleRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: ArticleAuthor;
  favoritesCount: number;
  favorited?: boolean;
}

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: string;
}

export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface ListArticlesFilter {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
  currentUserId?: string;
}

export interface IArticleRepository {
  create(data: CreateArticleData): Promise<ArticleRecord>;
  findBySlug(slug: string, currentUserId?: string): Promise<ArticleRecord | null>;
  update(slug: string, data: UpdateArticleData, currentUserId?: string): Promise<ArticleRecord>;
  delete(slug: string): Promise<void>;
  list(filter: ListArticlesFilter): Promise<{ articles: ArticleRecord[]; count: number }>;
  listFeed(userId: string, limit?: number, offset?: number): Promise<{ articles: ArticleRecord[]; count: number }>;
  favorite(userId: string, slug: string): Promise<ArticleRecord>;
  unfavorite(userId: string, slug: string): Promise<ArticleRecord>;
  isFavorited(userId: string, articleId: string): Promise<boolean>;
}
