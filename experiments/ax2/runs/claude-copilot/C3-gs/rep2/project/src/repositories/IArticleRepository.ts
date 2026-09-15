import {
  Article,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput,
} from '../domain/types';

/** An article paired with the total count for a paginated query. */
export interface ArticleListResult {
  articles: Article[];
  articlesCount: number;
}

/**
 * Persistence port for article aggregates and their favorite relationships.
 */
export interface IArticleRepository {
  /**
   * Persist a new article with its tag list.
   * @param input - New article fields.
   * @returns The created article.
   */
  create(input: CreateArticleInput): Promise<Article>;

  /**
   * Find an article by its slug.
   * @param slug - Article slug.
   * @returns The article, or null if not found.
   */
  findBySlug(slug: string): Promise<Article | null>;

  /**
   * List articles with optional filters and pagination.
   * @param filter - Tag/author/favorited filters and pagination.
   * @returns Articles and total count.
   */
  list(filter: ArticleListFilter): Promise<ArticleListResult>;

  /**
   * List articles authored by users the viewer follows.
   * @param userId - Viewer id.
   * @param filter - Pagination.
   * @returns Articles and total count.
   */
  feed(userId: number, filter: FeedFilter): Promise<ArticleListResult>;

  /**
   * Update mutable fields on an article.
   * @param id - Article id.
   * @param input - Fields to update.
   * @returns The updated article.
   */
  update(id: number, input: UpdateArticleInput): Promise<Article>;

  /**
   * Delete an article by id.
   * @param id - Article id.
   */
  delete(id: number): Promise<void>;

  /**
   * Add a favorite relationship between a user and an article.
   * @param userId - User id.
   * @param articleId - Article id.
   */
  addFavorite(userId: number, articleId: number): Promise<void>;

  /**
   * Remove a favorite relationship.
   * @param userId - User id.
   * @param articleId - Article id.
   */
  removeFavorite(userId: number, articleId: number): Promise<void>;

  /**
   * Whether the user has favorited the article.
   * @param userId - User id.
   * @param articleId - Article id.
   */
  isFavorited(userId: number, articleId: number): Promise<boolean>;

  /**
   * Count how many users have favorited the article.
   * @param articleId - Article id.
   */
  favoritesCount(articleId: number): Promise<number>;
}
