import { ArticleRepository } from '../repositories/article.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { CreateCommentInput } from '../validators/comment.schemas';
import { CommentView, toCommentView } from './article.presenter';

/**
 * Application service orchestrating comment reads and writes.
 */
export class CommentService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly articles: ArticleRepository,
    private readonly users: UserRepository
  ) {}

  private async followingSet(viewerId?: number): Promise<ReadonlySet<number>> {
    if (!viewerId) {
      return new Set<number>();
    }
    return new Set(await this.users.followingIds(viewerId));
  }

  /**
   * Lists comments for an article.
   * @param slug the article slug.
   * @param viewerId the authenticated viewer id, if any.
   * @returns comment views.
   */
  async list(slug: string, viewerId?: number): Promise<CommentView[]> {
    const article = await this.requireArticle(slug);
    const [rows, following] = await Promise.all([
      this.comments.listByArticle(article.id),
      this.followingSet(viewerId)
    ]);
    return rows.map((comment) => toCommentView(comment, following));
  }

  /**
   * Adds a comment to an article.
   * @param slug the article slug.
   * @param input validated comment fields.
   * @param authorId the authenticated author id.
   * @returns the created comment view.
   */
  async add(slug: string, input: CreateCommentInput, authorId: number): Promise<CommentView> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.create({
      body: input.body,
      authorId,
      articleId: article.id
    });
    const following = await this.followingSet(authorId);
    return toCommentView(comment, following);
  }

  /**
   * Deletes a comment; only its author may do so.
   * @param slug the article slug.
   * @param commentId the comment id.
   * @param userId the authenticated user id.
   */
  async delete(slug: string, commentId: number, userId: number): Promise<void> {
    await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError('comment does not exist');
    }
    if (comment.author.id !== userId) {
      throw new ForbiddenError('only the author may delete this comment');
    }
    await this.comments.delete(commentId);
  }

  private async requireArticle(slug: string) {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article does not exist');
    }
    return article;
  }
}
