import type { Comment } from '../types/domain';

/**
 * Port interface for comment persistence operations.
 *
 * This interface is owned by the domain/service layer.
 * Implementations:
 *   - `PrismaCommentRepository` — production (driven adapter using Prisma + PostgreSQL)
 *   - `InMemoryCommentRepository` — test doubles (fast, no database required)
 *
 * Services depend on this interface, never on concrete implementations.
 * Inject implementations at the composition root.
 */
export interface ICommentRepository {
  /**
   * Find a single comment by its primary key.
   *
   * @param id - The comment's numeric ID.
   * @returns The comment entity with embedded author profile, or null if not found.
   */
  findById(id: number): Promise<Comment | null>;

  /**
   * Find all comments for a given article, ordered by creation date descending.
   *
   * @param articleSlug - The parent article's slug.
   * @param currentUserId - Optional authenticated viewer ID for `author.following` computation.
   * @returns All comments on the article. Empty array if the article has no comments.
   */
  findByArticleSlug(articleSlug: string, currentUserId?: number): Promise<Comment[]>;

  /**
   * Create a new comment on an article.
   *
   * @param authorId - The authenticated user's ID who is authoring the comment.
   * @param articleSlug - The slug of the article being commented on.
   * @param body - The comment text body (non-empty, validated before this call).
   * @returns The created comment entity with embedded author profile and timestamps.
   * @throws `NotFoundError` — if no article with the given slug exists.
   */
  create(authorId: number, articleSlug: string, body: string): Promise<Comment>;

  /**
   * Delete a comment by its primary key.
   *
   * @param id - The comment's numeric ID.
   * @throws `NotFoundError` — if no comment with the given id exists.
   */
  delete(id: number): Promise<void>;
}
