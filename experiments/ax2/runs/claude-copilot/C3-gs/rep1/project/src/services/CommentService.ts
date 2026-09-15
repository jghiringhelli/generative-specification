import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { CommentView, toCommentView } from '../dtos/commentView';
import { CommentWithAuthor, ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { validate } from '../validation/validate';
import { createCommentSchema } from '../validation/articleSchemas';

/**
 * Application service for article comments.
 */
export class CommentService {
  private readonly commentRepository: ICommentRepository;
  private readonly articleRepository: IArticleRepository;
  private readonly profileRepository: IProfileRepository;

  /**
   * @param commentRepository - Comment persistence port.
   * @param articleRepository - Article persistence port.
   * @param profileRepository - Follow-relationship persistence port.
   */
  constructor(
    commentRepository: ICommentRepository,
    articleRepository: IArticleRepository,
    profileRepository: IProfileRepository,
  ) {
    this.commentRepository = commentRepository;
    this.articleRepository = articleRepository;
    this.profileRepository = profileRepository;
  }

  /**
   * List comments for an article.
   * @param slug - Article slug.
   * @param viewerId - Authenticated viewer id, if any.
   * @returns Comment views.
   */
  async list(slug: string, viewerId?: number): Promise<CommentView[]> {
    const article = await this.requireArticleId(slug);
    const comments = await this.commentRepository.findByArticleId(article);
    return Promise.all(comments.map((comment) => this.buildView(comment, viewerId)));
  }

  /**
   * Add a comment to an article.
   * @param slug - Article slug.
   * @param authorId - Authenticated author id.
   * @param input - Raw comment payload.
   * @returns The created comment view.
   */
  async create(slug: string, authorId: number, input: unknown): Promise<CommentView> {
    const articleId = await this.requireArticleId(slug);
    const { comment } = validate(createCommentSchema, input);
    const created = await this.commentRepository.create({
      body: comment.body,
      articleId,
      authorId,
    });
    return this.buildView(created, authorId);
  }

  /**
   * Delete a comment owned by the author.
   * @param slug - Article slug.
   * @param commentId - Comment id.
   * @param authorId - Authenticated author id.
   */
  async delete(slug: string, commentId: number, authorId: number): Promise<void> {
    await this.requireArticleId(slug);
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenError('You are not the author of this comment');
    }
    await this.commentRepository.delete(commentId);
  }

  /**
   * Resolve an article id by slug or throw NotFoundError.
   * @param slug - Article slug.
   * @returns The article id.
   */
  private async requireArticleId(slug: string): Promise<number> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article.id;
  }

  /**
   * Build a comment view resolving follow state for the author.
   * @param comment - Comment with author.
   * @param viewerId - Viewer id, if authenticated.
   * @returns The comment view.
   */
  private async buildView(comment: CommentWithAuthor, viewerId?: number): Promise<CommentView> {
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, comment.authorId)
      : false;
    return toCommentView(comment, following);
  }
}
