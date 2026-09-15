import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type { IArticleRepository } from '../repositories/IArticleRepository';
import type { CommentRecord, ICommentRepository } from '../repositories/ICommentRepository';

export interface CommentResponse {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: CommentRecord['author'];
}

export class CommentService {
  public constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
  ) {}

  /** Lists all comments for an article. */
  public async list(slug: string, viewerId?: string): Promise<ReadonlyArray<CommentResponse>> {
    const article = await this.requireArticle(slug, viewerId);
    const comments = await this.comments.listByArticleId(article.id, viewerId);
    return comments.map((comment) => this.toResponse(comment));
  }

  /** Adds a comment to an article. */
  public async create(slug: string, body: string, authorId: string): Promise<CommentResponse> {
    const article = await this.requireArticle(slug, authorId);
    const comment = await this.comments.create({ body, articleId: article.id, authorId });
    return this.toResponse(comment);
  }

  /** Deletes a comment when requested by its author. */
  public async delete(slug: string, commentId: string, userId: string): Promise<void> {
    const article = await this.requireArticle(slug, userId);
    const comment = await this.comments.findById(commentId, userId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError('Comment not found', { commentId, slug });
    }
    if (comment.authorId !== userId) throw new ForbiddenError('Only the author may delete this comment');
    await this.comments.delete(comment.id);
  }

  private async requireArticle(slug: string, viewerId?: string) {
    const article = await this.articles.findBySlug(slug, viewerId);
    if (!article) throw new NotFoundError('Article not found', { slug });
    return article;
  }

  private toResponse(comment: CommentRecord): CommentResponse {
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: comment.author,
    };
  }
}
