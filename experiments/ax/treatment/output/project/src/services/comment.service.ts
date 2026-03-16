import { ICommentRepository, CommentWithAuthor } from '../repositories/comment.repository';
import { IArticleRepository } from '../repositories/article.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import {
  CommentResponse,
  MultipleCommentsResponse,
  CreateCommentDTO
} from '../types/comment.types';
import { NotFoundError, AuthorizationError } from '../errors';

/**
 * Comment service.
 * Handles comment CRUD operations.
 */
export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Get all comments for an article.
   * @param slug Article slug
   * @param currentUserId Optional current user ID for follow status
   * @throws NotFoundError if article not found
   */
  async getComments(
    slug: string,
    currentUserId?: number
  ): Promise<MultipleCommentsResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    const comments = await this.commentRepository.findByArticleSlug(slug);

    const commentResponses = await Promise.all(
      comments.map((comment) => this.buildCommentResponse(comment, currentUserId))
    );

    return {
      comments: commentResponses
    };
  }

  /**
   * Add a comment to an article.
   * @param slug Article slug
   * @param dto Comment data
   * @param authorId User creating the comment
   * @throws NotFoundError if article not found
   */
  async addComment(
    slug: string,
    dto: CreateCommentDTO,
    authorId: number
  ): Promise<CommentResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    const comment = await this.commentRepository.create({
      body: dto.body,
      authorId,
      articleId: article.id
    });

    return this.buildCommentResponse(comment, authorId);
  }

  /**
   * Delete a comment.
   * Only the comment author can delete.
   * @param slug Article slug (for validation)
   * @param commentId Comment ID
   * @param currentUserId User attempting deletion
   * @throws NotFoundError if article or comment not found
   * @throws AuthorizationError if user is not comment author
   */
  async deleteComment(
    slug: string,
    commentId: number,
    currentUserId: number
  ): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment', commentId);
    }

    if (comment.authorId !== currentUserId) {
      throw new AuthorizationError('Only the comment author can delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }

  /**
   * Build comment response with author profile.
   */
  private async buildCommentResponse(
    comment: CommentWithAuthor,
    currentUserId?: number
  ): Promise<CommentResponse> {
    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, comment.author.id)
      : false;

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following
      }
    };
  }
}
