import { ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { CommentResponseDto, CommentEntity } from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/AppError';

export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Retrieves all comments for a specific article.
   * @param slug - Article slug.
   * @param currentUserId - Optional id of the authenticated user.
   */
  async getComments(slug: string, currentUserId?: string): Promise<CommentResponseDto[]> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comments = await this.commentRepository.findByArticleSlug(slug);
    return Promise.all(comments.map((c) => this.mapToDto(c, currentUserId)));
  }

  /**
   * Adds a new comment to an article.
   * @param authorId - Authenticated user id.
   * @param slug - Article slug.
   * @param body - Comment body text.
   */
  async createComment(
    authorId: string,
    slug: string,
    body: string
  ): Promise<CommentResponseDto> {
    if (!body || !body.trim()) {
      throw new ValidationError({ body: ["can't be blank"] });
    }

    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const comment = await this.commentRepository.create(article.id, authorId, body.trim());
    return this.mapToDto(comment, authorId);
  }

  /**
   * Deletes a comment from an article (author only).
   * @param authorId - Authenticated user id.
   * @param commentId - Comment identifier.
   */
  async deleteComment(authorId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment '${commentId}' not found`);
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }

  private async mapToDto(comment: CommentEntity, currentUserId?: string): Promise<CommentResponseDto> {
    let following = false;
    if (currentUserId && comment.authorId && currentUserId !== comment.authorId) {
      following = await this.profileRepository.isFollowing(currentUserId, comment.authorId);
    }

    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author?.username ?? '',
        bio: comment.author?.bio ?? '',
        image: comment.author?.image ?? '',
        following
      }
    };
  }
}
