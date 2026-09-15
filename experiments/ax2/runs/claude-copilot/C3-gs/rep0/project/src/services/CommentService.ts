import { z } from 'zod';
import { ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import {
  CommentListResponse,
  CommentResponse,
  CommentView,
  toCommentListResponse,
  toCommentResponse,
  toCommentView
} from '../dto/commentView';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { parseOrThrow } from '../utils/validation';
import { ArticleEntity, CommentEntity, UserEntity } from '../domain/types';

const createSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank")
  })
});

/**
 * Business logic for article comments.
 */
export class CommentService {
  /**
   * @param commentRepository - Comment persistence port.
   * @param articleRepository - Article lookup port (slug resolution).
   * @param userRepository - User lookup port (author profiles).
   * @param profileRepository - Follow relationship port.
   */
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly articleRepository: IArticleRepository,
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * List comments for an article.
   * @param slug - The article slug.
   * @param viewerId - Authenticated viewer id, if any.
   * @returns The comment list response.
   */
  async listForArticle(slug: string, viewerId: number | undefined): Promise<CommentListResponse> {
    const article = await this.requireArticle(slug);
    const comments = await this.commentRepository.findByArticle(article.id);
    const views = await Promise.all(comments.map((c) => this.buildView(c, viewerId)));
    return toCommentListResponse(views);
  }

  /**
   * Add a comment to an article.
   * @param slug - The article slug.
   * @param input - Raw request body.
   * @param author - The authenticated author.
   * @returns The created comment response.
   */
  async addComment(slug: string, input: unknown, author: UserEntity): Promise<CommentResponse> {
    const { comment } = parseOrThrow(createSchema, input);
    const article = await this.requireArticle(slug);
    const created = await this.commentRepository.create({
      body: comment.body,
      articleId: article.id,
      authorId: author.id
    });
    return toCommentResponse(await this.buildView(created, author.id));
  }

  /**
   * Delete a comment; only its author may do so.
   * @param slug - The article slug.
   * @param commentId - The comment id.
   * @param user - The authenticated user.
   */
  async deleteComment(slug: string, commentId: number, user: UserEntity): Promise<void> {
    const article = await this.requireArticle(slug);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError('comment not found');
    }
    if (comment.authorId !== user.id) {
      throw new ForbiddenError('you are not the author of this comment');
    }
    await this.commentRepository.delete(commentId);
  }

  /**
   * Load an article by slug or throw 404.
   * @param slug - The article slug.
   * @returns The article entity.
   */
  private async requireArticle(slug: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article not found');
    }
    return article;
  }

  /**
   * Build a comment view resolving author and follow state.
   * @param comment - The comment entity.
   * @param viewerId - Viewer id, if any.
   * @returns The comment view.
   */
  private async buildView(
    comment: CommentEntity,
    viewerId: number | undefined
  ): Promise<CommentView> {
    const author = await this.userRepository.findById(comment.authorId);
    if (!author) {
      throw new NotFoundError('comment author not found');
    }
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, author.id)
      : false;
    return toCommentView(comment, author, following);
  }
}
