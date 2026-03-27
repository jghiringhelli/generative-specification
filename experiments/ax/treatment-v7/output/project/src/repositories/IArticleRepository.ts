import type {
  Article,
  ArticleFilters,
  CreateArticleData,
  PaginatedArticles,
  Pagination,
  UpdateArticleData,
} from '../types/domain';

/**
 * Port interface for article persistence operations.
 *
 * This interface is owned by the domain/service layer.
 * Implementations:
 *   - `PrismaArticleRepository` — production (driven adapter using Prisma + PostgreSQL)
 *   - `InMemoryArticleRepository` — test doubles (fast, no database required)
 *
 * Services depend on this interface, never on concrete implementations.
 * Inject implementations at the composition root.
 */
export interface IArticleRepository {
  /**
   * Find a single article by its URL slug.
   *
   * @param slug - The article's unique slug.
   * @param currentUserId - Optional authenticated viewer ID.
   *   When provided, `favorited` and `author.following` are computed relative to this user.
   * @returns The article entity with embedded author profile and tag list, or null if not found.
   */
  findBySlug(slug: string, currentUserId?: number): Promise<Article | null>;

  /**
   * Find all articles matching optional filters, with pagination.
   *
   * @param filters - Optional `tag`, `author`, and `favorited` constraints.
   * @param pagination - `limit` (max results) and `offset` (records to skip).
   * @param currentUserId - Optional authenticated viewer ID for `favorited`/`following` fields.
   * @returns Paginated articles array and total matching count (before pagination).
   */
  findAll(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number,
  ): Promise<PaginatedArticles>;

  /**
   * Find articles from users the given user follows (the personalized feed).
   *
   * @param userId - The authenticated user's ID (determines whose articles appear).
   * @param pagination - `limit` and `offset` for the result set.
   * @returns Paginated feed articles and total count.
   */
  findFeed(userId: number, pagination: Pagination): Promise<PaginatedArticles>;

  /**
   * Create a new article.
   *
   * @param authorId - The authenticated user's ID who is creating the article.
   * @param data - Article creation payload including title, description, body, and tagList.
   * @returns The created article entity with all fields including generated slug and timestamps.
   */
  create(authorId: number, data: CreateArticleData): Promise<Article>;

  /**
   * Update an existing article's mutable fields.
   *
   * @param slug - The article's current slug (used to identify the record).
   * @param data - Partial update payload. Only provided fields are changed.
   *   If `title` is changed, the slug is regenerated from the new title.
   * @returns The updated article entity with all fields populated.
   * @throws `NotFoundError` — if no article with the given slug exists.
   */
  update(slug: string, data: UpdateArticleData): Promise<Article>;

  /**
   * Delete an article by its slug.
   *
   * @param slug - The article's slug.
   * @throws `NotFoundError` — if no article with the given slug exists.
   */
  delete(slug: string): Promise<void>;

  /**
   * Add a favorite relationship between a user and an article.
   *
   * Idempotent: calling with an existing favorite does not throw.
   *
   * @param userId - The ID of the user favoriting the article.
   * @param slug - The article's slug.
   * @returns The updated article entity with incremented `favoritesCount` and `favorited: true`.
   * @throws `NotFoundError` — if no article with the given slug exists.
   */
  addFavorite(userId: number, slug: string): Promise<Article>;

  /**
   * Remove a favorite relationship between a user and an article.
   *
   * Idempotent: calling when no favorite exists does not throw.
   *
   * @param userId - The ID of the user unfavoriting the article.
   * @param slug - The article's slug.
   * @returns The updated article entity with decremented `favoritesCount` and `favorited: false`.
   * @throws `NotFoundError` — if no article with the given slug exists.
   */
  removeFavorite(userId: number, slug: string): Promise<Article>;
}
