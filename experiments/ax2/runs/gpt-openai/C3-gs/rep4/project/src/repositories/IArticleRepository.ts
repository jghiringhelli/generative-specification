import type { Article, Tag, User } from '@prisma/client';

export interface ArticleRecord extends Article {
  readonly author: User;
  readonly tags: ReadonlyArray<Tag>;
  readonly _count: { readonly favoritedBy: number };
}

export interface CreateArticleData {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly slug: string;
  readonly authorId: string;
  readonly tagList: ReadonlyArray<string>;
}

export interface UpdateArticleData {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly slug?: string;
}

export interface ArticleFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface IArticleRepository {
  create(data: CreateArticleData): Promise<ArticleRecord>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  list(filters: ArticleFilters): Promise<ReadonlyArray<ArticleRecord>>;
  count(filters: ArticleFilters): Promise<number>;
  feed(userId: string, limit: number, offset: number): Promise<ReadonlyArray<ArticleRecord>>;
  feedCount(userId: string): Promise<number>;
  update(id: string, data: UpdateArticleData): Promise<ArticleRecord>;
  delete(id: string): Promise<void>;
  favorite(articleId: string, userId: string): Promise<ArticleRecord>;
  unfavorite(articleId: string, userId: string): Promise<ArticleRecord>;
  isFavorited(articleId: string, userId: string): Promise<boolean>;
}
