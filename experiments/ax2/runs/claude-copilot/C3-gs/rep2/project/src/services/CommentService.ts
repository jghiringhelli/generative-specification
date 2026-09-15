import { ICommentRepository } from '../repositories/ICommentRepository';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { ProfileService } from './ProfileService';
import { CommentDTO } from '../dto';
import { Comment } from '../domain/types';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

/**
 * Business logic for article comments.
 */
export class CommentService {
  private readonly comments: ICommentRepository;
  private readonly articles: IArticleRepository;
  private readonly users: IUserRepository;
  private readonly profiles: ProfileService;

  /**
   * @param comments - Comment repository port.
   * @param articles - Article repository port.
   * @param users - User repository port.
   * @param profiles - Profile service for author projection.
   */
  constructor(
    comments: ICommentRepository,
    articles: IArticleRepository,
    users: IUserRepository,
    profiles: ProfileService,
  ) {
    this.comments = comments;
    this.articles = articles;
    this.users = users;
    this.profiles = profiles;
  }

  /**
   * List all comments on an article.
   * @param slug - Article slug.
   * @param viewerId - Viewer id, if authenticated.
   * @returns The comment views.
   * @throws NotFoundError if the article is missing.
   */
  async list(slug: string, viewerId?: number): Promise<CommentDTO[]> {
    const article = await this.requireArticleId(slug);
    const comments = await this.comments.listByArticle(article);
    return Promise.all(comments.map((comment) => this.toCommentDTO(comment, viewerId)));
  }

  /**
   * Add a comment to an article.
   * @param slug - Article slug.
   * @param authorId - Authenticated author id.
   * @param body - Comment body.
   * @returns The created comment view.
   * @throws NotFoundError if the article is missing.
   */
  async create(slug: string, authorId: number, body: string): Promise<CommentDTO> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.comments.create({ body, articleId, authorId });
    return this.toCommentDTO(comment, authorId);
  }

  /**
   * Delete a comment; only its author may do so.
   * @param slug - Article slug.
   * @param commentId - Comment id.
   * @param userId - Authenticated user id.
   * @throws NotFoundError if the article or comment is missing.
   * @throws ForbiddenError if the user is not the comment author.
   */
  async delete(slug: string, commentId: number, userId: number): Promise<void> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.articleId !== articleId) {
      throw new NotFoundError('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this comment');
    }
    await this.comments.delete(commentId);
  }

  /**
   * Resolve an article slug to its id or throw.
   * @param slug - Article slug.
   * @returns The article id.
   * @throws NotFoundError if not found.
   */
  private async requireArticleId(slug: string): Promise<number> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article.id;
  }

  /**
   * Map a comment to its DTO, composing the author profile.
   * @param comment - Domain comment.
   * @param viewerId - Viewer id, if any.
   * @returns The comment view.
   * @throws NotFoundError if the author no longer exists.
   */
  private async toCommentDTO(comment: Comment, viewerId?: number): Promise<CommentDTO> {
    const author = await this.users.findById(comment.authorId);
    if (!author) {
      throw new NotFoundError('Comment author not found');
    }
    const authorProfile = await this.profiles.buildProfile(author, viewerId);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: authorProfile,
    };
  }
}
