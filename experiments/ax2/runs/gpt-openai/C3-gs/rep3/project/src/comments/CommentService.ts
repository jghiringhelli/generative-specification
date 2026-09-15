import { ForbiddenError, NotFoundError } from '../errors/AppError';
import {
  IArticleRepository,
  ArticleRecord,
} from '../repositories/IArticleRepository';
import {
  CommentRecord,
  ICommentRepository,
} from '../repositories/ICommentRepository';

export interface CommentView {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly body: string;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

export class CommentService {
  public constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
  ) {}

  /** Lists comments for an article. */
  public async list(
    slug: string,
    viewerId?: string,
  ): Promise<ReadonlyArray<CommentView>> {
    const article = await this.requireArticle(slug);
    const comments = await this.comments.listByArticle(article.id);
    return comments.map((comment) => this.toView(comment, viewerId));
  }

  /** Adds an authenticated user's comment to an article. */
  public async create(
    slug: string,
    userId: string,
    body: string,
  ): Promise<CommentView> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.create(article.id, userId, body);
    return this.toView(comment, userId);
  }

  /** Deletes a comment when the caller is its author. */
  public async delete(
    slug: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError(`Comment ${commentId} not found`);
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError('Only the author may delete this comment');
    }
    await this.comments.delete(commentId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) throw new NotFoundError(`Article ${slug} not found`);
    return article;
  }

  private toView(comment: CommentRecord, viewerId?: string): CommentView {
    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: viewerId
          ? comment.author.followerIds.includes(viewerId)
          : false,
      },
    };
  }
}
