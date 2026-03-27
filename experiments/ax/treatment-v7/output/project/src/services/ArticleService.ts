import type {
  Article,
  ArticleFilters,
  CreateArticleData,
  PaginatedArticles,
  Pagination,
  UpdateArticleData,
} from '../types/domain';
import type { IArticleRepository } from '../repositories/IArticleRepository';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

/** Defaults for article list pagination — named constants per §4. */
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * Business logic for article CRUD, feed, and favorite operations.
 *
 * Depends on `IArticleRepository` (injected) — never on concrete Prisma classes.
 * Wire the concrete implementation at the composition root (`src/server.ts`).
 */
export class ArticleService {
  constructor(private readonly articleRepository: IArticleRepository) {}

  /**
   * Retrieve a paginated list of articles with optional filters.
   *
   * @param filters - Optional tag, author, and favorited constraints
   * @param pagination - Limit and offset (defaults applied if not provided)
   * @param currentUserId - Optional viewer ID for `favorited`/`following` fields
   * @returns Paginated articles and total matching count
   */
  async listArticles(
    filters: ArticleFilters,
    pagination: Partial<Pagination>,
    currentUserId?: number,
  ): Promise<PaginatedArticles> {
    const resolved: Pagination = {
      limit: pagination.limit ?? DEFAULT_LIMIT,
      offset: pagination.offset ?? DEFAULT_OFFSET,
    };
    return this.articleRepository.findAll(filters, resolved, currentUserId);
  }

  /**
   * Retrieve a paginated feed of articles from users the viewer follows.
   *
   * @param userId - The authenticated user's ID
   * @param pagination - Limit and offset (defaults applied if not provided)
   * @returns Paginated feed articles and total count
   */
  async getFeed(userId: number, pagination: Partial<Pagination>): Promise<PaginatedArticles> {
    const resolved: Pagination = {
      limit: pagination.limit ?? DEFAULT_LIMIT,
      offset: pagination.offset ?? DEFAULT_OFFSET,
    };
    return this.articleRepository.findFeed(userId, resolved);
  }

  /**
   * Retrieve a single article by its slug.
   *
   * @param slug - The article's URL slug
   * @param currentUserId - Optional viewer ID for `favorited`/`following` fields
   * @returns The article entity
   * @throws `NotFoundError` if no article with that slug exists
   */
  async getArticle(slug: string, currentUserId?: number): Promise<Article> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!article) throw new NotFoundError('article');
    return article;
  }

  /**
   * Create a new article authored by the given user.
   *
   * @param authorId - The authenticated user's ID
   * @param data - Article creation payload
   * @returns The created article with all fields populated
   */
  async createArticle(authorId: number, data: CreateArticleData): Promise<Article> {
    return this.articleRepository.create(authorId, data);
  }

  /**
   * Update a mutable article fields. Only the article's author may update.
   *
   * @param slug - The article's current slug
   * @param userId - The authenticated user's ID (must match authorId)
   * @param data - Partial update payload
   * @returns The updated article with viewer context for `favorited`/`following`
   * @throws `NotFoundError` if no article with that slug exists
   * @throws `ForbiddenError` if the user is not the article's author
   */
  async updateArticle(slug: string, userId: number, data: UpdateArticleData): Promise<Article> {
    const existing = await this.articleRepository.findBySlug(slug);
    if (!existing) throw new NotFoundError('article');
    if (existing.authorId !== userId) throw new ForbiddenError('article');

    const updated = await this.articleRepository.update(slug, data);
    // Re-fetch with viewer context — slug may have changed if title was updated
    const withViewer = await this.articleRepository.findBySlug(updated.slug, userId);
    return withViewer!;
  }

  /**
   * Delete an article. Only the article's author may delete.
   *
   * @param slug - The article's slug
   * @param userId - The authenticated user's ID (must match authorId)
   * @throws `NotFoundError` if no article with that slug exists
   * @throws `ForbiddenError` if the user is not the article's author
   */
  async deleteArticle(slug: string, userId: number): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug);
    if (!existing) throw new NotFoundError('article');
    if (existing.authorId !== userId) throw new ForbiddenError('article');
    await this.articleRepository.delete(slug);
  }

  /**
   * Add the article to the user's favorites (idempotent).
   *
   * @param userId - The authenticated user's ID
   * @param slug - The article's slug
   * @returns The article with `favorited: true`
   * @throws `NotFoundError` if no article with that slug exists
   */
  async favoriteArticle(userId: number, slug: string): Promise<Article> {
    return this.articleRepository.addFavorite(userId, slug);
  }

  /**
   * Remove the article from the user's favorites (idempotent).
   *
   * @param userId - The authenticated user's ID
   * @param slug - The article's slug
   * @returns The article with `favorited: false`
   * @throws `NotFoundError` if no article with that slug exists
   */
  async unfavoriteArticle(userId: number, slug: string): Promise<Article> {
    return this.articleRepository.removeFavorite(userId, slug);
  }
}
