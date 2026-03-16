import { CommentRepository } from '../repositories/comment.repository';
import { NotFoundError } from '../errors/NotFoundError';
import { AuthorizationError } from '../errors/AuthorizationError';
import {
  CommentDto,
  CommentAuthor,
  SingleCommentResponse,
  MultipleCommentsResponse,
} from '../types/comment.types';

export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  /**
   * Get all comments for an article
   */
  async getComments(
    articleSlug: string,
    currentUserId?: number
  ): Promise<MultipleCommentsResponse> {
    const comments = await this.commentRepository.findByArticleSlug(articleSlug, currentUserId);

    return {
      comments: comments.map((comment) => this.toCommentDto(comment, currentUserId)),
    };
  }

  /**
   * Add a comment to an article
   * @throws NotFoundError if article doesn't exist
   */
  async addComment(
    articleSlug: string,
    body: string,
    authorId: number
  ): Promise<SingleCommentResponse> {
    try {
      const comment = await this.commentRepository.create(
        { body, authorId, articleSlug },
        authorId
      );

      return {
        comment: this.toCommentDto(comment, authorId),
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Article not found') {
        throw new NotFoundError('Article');
      }
      throw error;
    }
  }

  /**
   * Delete a comment
   * @throws NotFoundError if comment doesn't exist
   * @throws AuthorizationError if user is not the author
   */
  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment');
    }

    if ((comment as any).author.id !== userId) {
      throw new AuthorizationError('only author can delete comment');
    }

    await this.commentRepository.delete(commentId);
  }

  /**
   * Convert repository comment to CommentDto
   */
  private toCommentDto(comment: any, currentUserId?: number): CommentDto {
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: this.toAuthorDto(comment.author, currentUserId),
    };
  }

  /**
   * Convert author data to CommentAuthor DTO
   */
  private toAuthorDto(author: any, currentUserId?: number): CommentAuthor {
    const following = currentUserId
      ? Array.isArray(author.followedBy) && author.followedBy.length > 0
      : false;

    return {
      username: author.username,
      bio: author.bio,
      image: author.image,
      following,
    };
  }
}
