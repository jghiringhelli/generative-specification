
/**
 * Comment service.
 * Handles comment creation, retrieval, and deletion.
 */

import type { ICommentRepository } from '../repositories/ICommentRepository';

export interface CommentResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export class CommentService {
  constructor(private readonly commentRepository: ICommentRepository) {}

  /**
   * Get all comments for an article.
   * @param articleSlug - Article slug
   * @param currentUserId - ID of user viewing comments (null if anonymous)
   * @throws NotFoundError if article does not exist
   */
  async getCommentsByArticleSlug(
    articleSlug: string,
    currentUserId: number | null
  ): Promise<CommentResponse[]> {
    return await this.commentRepository.getByArticleSlug(articleSlug, currentUserId);
  }

  /**
   * Add a comment to an article.
   * @param articleSlug - Article slug
   * @param body - Comment text
   * @param authorId - ID of user posting the comment
   * @throws NotFoundError if article does not exist
   */
  async addComment(
    articleSlug: string,
    body: string,
    authorId: number
  ): Promise<CommentResponse> {
    return await this.commentRepository.create(articleSlug, body, authorId);
  }

  /**
   * Delete a comment.
   * @param id - Comment ID
   * @param currentUserId - ID of user attempting deletion
   * @throws NotFoundError if comment does not exist
   * @throws ForbiddenError if current user is not the comment author
   */
  async deleteComment(id: number, currentUserId: number): Promise<void> {
    await this.commentRepository.delete(id, currentUserId);
  }
}
