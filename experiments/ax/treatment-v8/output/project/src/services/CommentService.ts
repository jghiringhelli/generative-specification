/**
 * Application service for comments on an article. It resolves the article by
 * slug (404 if absent or soft-deleted), orchestrates the comment and user ports,
 * embeds the viewer-relative author profile, and enforces author-only deletion.
 * It contains no HTTP or framework concerns and throws {@link AppError}
 * subclasses the boundary maps to status codes.
 *
 * @gs-links: docs/specs/comments.md, docs/use-cases.md
 */
import { ForbiddenError, NotFoundError } from '../errors/AppError.js';
import type { IArticleRepository } from '../repositories/IArticleRepository.js';
import type { Comment, ICommentRepository } from '../repositories/ICommentRepository.js';
import type { IProfileRepository } from '../repositories/IProfileRepository.js';
import type { IUserRepository } from '../repositories/IUserRepository.js';

/** The author projection embedded in a comment view (viewer-relative `following`). */
export interface CommentAuthorView {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/** A fully-resolved comment as the HTTP layer presents it. */
export interface CommentView {
  readonly id: number;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author: CommentAuthorView;
}

export class CommentService {
  constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /**
   * List an article's comments, newest first.
   *
   * @throws NotFoundError if the slug is unknown.
   */
  async listForArticle(slug: string, viewerId?: string): Promise<ReadonlyArray<CommentView>> {
    const article = await this.requireArticleId(slug);
    const comments = await this.comments.listByArticle(article);
    return Promise.all(comments.map((comment) => this.toView(comment, viewerId)));
  }

  /**
   * Add a comment to an article on behalf of the author.
   *
   * @throws NotFoundError if the slug is unknown.
   */
  async add(slug: string, authorId: string, body: string): Promise<CommentView> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.comments.create({ body, articleId, authorId });
    return this.toView(comment, authorId);
  }

  /**
   * Soft-delete a comment. Only its author may delete it, and it must belong to
   * the named article.
   *
   * @throws NotFoundError if the slug or comment is unknown (or mismatched).
   * @throws ForbiddenError if the caller is not the comment's author.
   */
  async delete(slug: string, commentId: number, userId: string): Promise<void> {
    const articleId = await this.requireArticleId(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.articleId !== articleId) {
      throw new NotFoundError('Comment', String(commentId));
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this comment', {
        comment: ['forbidden'],
      });
    }
    await this.comments.delete(commentId);
  }

  /** Resolve a slug to its article id, or throw a 404-mapping error. */
  private async requireArticleId(slug: string): Promise<string> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article', slug);
    }
    return article.id;
  }

  /** Resolve a domain comment plus the viewer's relationship into a view. */
  private async toView(comment: Comment, viewerId?: string): Promise<CommentView> {
    const author = await this.resolveAuthor(comment.authorId, viewerId);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author,
    };
  }

  /** Resolve an author id to the embedded profile, with viewer-relative `following`. */
  private async resolveAuthor(authorId: string, viewerId?: string): Promise<CommentAuthorView> {
    const author = await this.users.findById(authorId);
    if (!author) {
      throw new NotFoundError('Author', authorId);
    }
    const following =
      viewerId !== undefined ? await this.profiles.isFollowing(viewerId, authorId) : false;
    return { username: author.username, bio: author.bio, image: author.image, following };
  }
}
