import { z } from 'zod';
import type { ICommentRepository, CommentWithAuthor } from '../repositories/ICommentRepository.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/AppError.js';

/** Zod schema for creating a comment. */
const createCommentSchema = z.object({
  body: z.string().min(1, 'is required'),
});

/** Comment response shape per RealWorld API spec. */
export interface CommentResponse {
  readonly id: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

/**
 * Formats a CommentWithAuthor into the API response shape.
 */
function formatComment(comment: CommentWithAuthor): CommentResponse {
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: comment.author,
  };
}

/**
 * Service handling comment CRUD operations.
 * Depends on ICommentRepository (injected at composition root).
 */
export class CommentService {
  constructor(private readonly commentRepository: ICommentRepository) {}

  /**
   * Get all comments for an article.
   * @param articleSlug - The article's URL slug.
   * @param currentUserId - Optional ID of the requesting user for following state.
   * @returns Array of comments.
   */
  async getComments(
    articleSlug: string,
    currentUserId?: number,
  ): Promise<{ comments: CommentResponse[] }> {
    const comments = await this.commentRepository.findByArticleSlug(articleSlug, currentUserId);
    return { comments: comments.map(formatComment) };
  }

  /**
   * Add a comment to an article.
   * @param articleSlug - The article's URL slug.
   * @param authorId - The authenticated user's ID.
   * @param input - Raw comment input (validated inside).
   * @returns The created comment.
   */
  async addComment(
    articleSlug: string,
    authorId: number,
    input: unknown,
  ): Promise<{ comment: CommentResponse }> {
    const result = createCommentSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const comment = await this.commentRepository.create({
      body: result.data.body,
      authorId,
      articleSlug,
    });

    return { comment: formatComment(comment) };
  }

  /**
   * Delete a comment. Only the author may delete.
   * @param commentId - The comment's ID.
   * @param requestingUserId - The authenticated user's ID.
   */
  async deleteComment(commentId: number, requestingUserId: number): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment', String(commentId));
    }
    if (comment.authorId !== requestingUserId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }
    await this.commentRepository.delete(commentId);
  }
}
