import {
  ArticleEntity,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput
} from '../domain/types';

/**
 * The result of a paged article query: the page of articles and the total
 * count matching the filter (before pagination).
 */
export interface ArticleListResult {
  articles: ArticleEntity[];
  total: number;
}

/**
 * Persistence port for articles, including favoriting relationships.
 */
export interface IArticleRepository {
  /**
   * Find an article by its unique slug.
   * @param slug - The article slug.
   * @returns The article, or null if none exists.
   */
  findBySlug(slug: string): Promise<ArticleEntity | null>;

  /**
   * List articles matching the given filters, most recent first.
   * @param filter - Tag/author/favorited filters plus pagination.
   * @returns The page of articles and the total matching count.
   */
  list(filter: ArticleListFilter): Promise<ArticleListResult>;

  /**
   * List articles authored by the given set of users (the feed).
   * @param authorIds - Ids of followed authors.
   * @param filter - Pagination.
   * @returns The page of articles and the total matching count.
   */
  feed(authorIds: number[], filter: FeedFilter): Promise<ArticleListResult>;

  /**
   * Create a new article.
   * @param input - Article fields including author and tags.
   * @returns The created article.
   */
  create(input: CreateArticleInput): Promise<ArticleEntity>;

  /**
   * Update an existing article.
   * @param id - Article id.
   * @param input - Partial fields to change.
   * @returns The updated article.
   */
  update(id: number, input: UpdateArticleInput): Promise<ArticleEntity>;

  /**
   * Delete an article by id.
   * @param id - Article id.
   */
  delete(id: number): Promise<void>;

  /**
   * Add a favorite relationship between a user and an article. Idempotent.
   * @param userId - The favoriting user's id.
   * @param articleId - The article id.
   */
  addFavorite(userId: number, articleId: number): Promise<void>;

  /**
   * Remove a favorite relationship. Idempotent.
   * @param userId - The user's id.
   * @param articleId - The article id.
   */
  removeFavorite(userId: number, articleId: number): Promise<void>;

  /**
   * Determine whether a user has favorited an article.
   * @param userId - The user's id.
   * @param articleId - The article id.
   * @returns True if favorited.
   */
  isFavorited(userId: number, articleId: number): Promise<boolean>;

  /**
   * Count how many users have favorited an article.
   * @param articleId - The article id.
   * @returns The favorites count.
   */
  favoritesCount(articleId: number): Promise<number>;
}
