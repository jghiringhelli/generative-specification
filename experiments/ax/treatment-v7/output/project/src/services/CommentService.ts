import type { Comment } from '../types/domain';
import type { ICommentRepository } from '../repositories/ICommentRepository';
import type { IArticleRepository } from '../repositories/IArticleRepository';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

/**
 * Business logic for comment creation, retrieval, and deletion.
 *
 * Depends on `ICommentRepository` and `IArticleRepository` (both injected) —
 * never on concrete Prisma classes. Wire concrete implementations at the
 * composition root (`src/server.ts`).
 */
export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
  ) {}

  /**
   * Retrieve all comments for an article, ordered by creation date descending.
   *
   * @param articleSlug - The parent article's slug
   * @param currentUserId - Optional viewer ID for `author.following` computation
   * @returns Ordered list of comments
   * @throws `NotFoundError` if no article with the given slug exists
   */
  async getComments(articleSlug: string, currentUserId?: number): Promise<Comment[]> {
    const article = await this.articleRepository.findBySlug(articleSlug);
    if (!article) throw new NotFoundError('article');
    return this.commentRepository.findByArticleSlug(articleSlug, currentUserId);
  }

  /**
   * Add a new comment to an article.
   *
   * @param userId - The authenticated user's ID
   * @param articleSlug - The slug of the article being commented on
   * @param body - The comment text (validated non-empty before this call)
   * @returns The created comment with embedded author profile
   * @throws `NotFoundError` if no article with the given slug exists
   */
  async addComment(userId: number, articleSlug: string, body: string): Promise<Comment> {
    const article = await this.articleRepository.findBySlug(articleSlug);
    if (!article) throw new NotFoundError('article');
    return this.commentRepository.create(userId, articleSlug, body);
  }

  /**
   * Delete a comment. Only the comment's author may delete.
   *
   * @param userId - The authenticated user's ID (must match comment's authorId)
   * @param articleSlug - The parent article's slug (used to verify article exists)
   * @param commentId - The comment's numeric ID
   * @throws `NotFoundError` if the article or comment does not exist
   * @throws `ForbiddenError` if the user is not the comment's author
   */
  async deleteComment(userId: number, articleSlug: string, commentId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(articleSlug);
    if (!article) throw new NotFoundError('article');

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundError('comment');
    if (comment.authorId !== userId) throw new ForbiddenError('comment');

    await this.commentRepository.delete(commentId);
  }
}
