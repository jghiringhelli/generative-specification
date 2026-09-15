import { Article, Tag, User } from '@prisma/client';

/**
 * Filters and pagination for listing articles.
 */
export interface ArticleListFilter {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

/**
 * Data required to create an article.
 */
export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList: string[];
}

/**
 * Mutable fields for updating an article.
 */
export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

/**
 * An article with its author and tags eagerly loaded.
 */
export type ArticleWithRelations = Article & {
  author: User;
  tags: Tag[];
};

/**
 * Persistence port for article aggregate operations.
 */
export interface IArticleRepository {
  /**
   * Create an article and associate its tags.
   * @param data - Article fields including tag list.
   * @returns The persisted article with relations.
   */
  create(data: CreateArticleData): Promise<ArticleWithRelations>;

  /**
   * Find an article by slug.
   * @param slug - Article slug.
   * @returns The article with relations or null.
   */
  findBySlug(slug: string): Promise<ArticleWithRelations | null>;

  /**
   * List articles matching filters, most recent first.
   * @param filter - Tag/author/favorited filters and pagination.
   * @returns Matching articles with relations.
   */
  list(filter: ArticleListFilter): Promise<ArticleWithRelations[]>;

  /**
   * Count articles matching filters (ignoring pagination).
   * @param filter - Tag/author/favorited filters.
   * @returns Total matching count.
   */
  count(filter: ArticleListFilter): Promise<number>;

  /**
   * List feed articles authored by the given user ids, most recent first.
   * @param followedIds - Ids of followed authors.
   * @param limit - Page size.
   * @param offset - Page offset.
   * @returns Feed articles with relations.
   */
  feed(followedIds: number[], limit: number, offset: number): Promise<ArticleWithRelations[]>;

  /**
   * Count feed articles authored by the given user ids.
   * @param followedIds - Ids of followed authors.
   * @returns Total feed count.
   */
  countFeed(followedIds: number[]): Promise<number>;

  /**
   * Update an article's mutable fields.
   * @param id - Article id.
   * @param data - Fields to update.
   * @returns The updated article with relations.
   */
  update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations>;

  /**
   * Delete an article by id.
   * @param id - Article id.
   */
  delete(id: number): Promise<void>;

  /**
   * Add a favorite for the given user and article.
   * @param userId - User id.
   * @param articleId - Article id.
   */
  addFavorite(userId: number, articleId: number): Promise<void>;

  /**
   * Remove a favorite for the given user and article.
   * @param userId - User id.
   * @param articleId - Article id.
   */
  removeFavorite(userId: number, articleId: number): Promise<void>;

  /**
   * Count favorites for an article.
   * @param articleId - Article id.
   * @returns Number of favorites.
   */
  favoritesCount(articleId: number): Promise<number>;

  /**
   * Determine whether a user has favorited an article.
   * @param userId - User id.
   * @param articleId - Article id.
   * @returns True if favorited.
   */
  isFavorited(userId: number, articleId: number): Promise<boolean>;
}
