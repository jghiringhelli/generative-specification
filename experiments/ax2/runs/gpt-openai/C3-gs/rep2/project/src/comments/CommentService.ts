import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { IArticleRepository, ArticleRecord } from '../repositories/IArticleRepository';
import { CommentRecord, ICommentRepository } from '../repositories/ICommentRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository, UserRecord } from '../repositories/IUserRepository';
import { CommentResponse } from './contracts';

export class CommentService {
  public constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /** Lists comments for an article. */
  public async list(slug: string, viewerId?: string): Promise<ReadonlyArray<CommentResponse>> {
    const article = await this.requireArticle(slug);
    const comments = await this.comments.listByArticleId(article.id);
    return Promise.all(comments.map((comment) => this.view(comment, viewerId)));
  }

  /** Adds a comment to an article. */
  public async create(slug: string, body: string, authorId: string): Promise<CommentResponse> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.create({ articleId: article.id, authorId, body });
    return this.view(comment, authorId);
  }

  /** Deletes a comment when the authenticated user is its author. */
  public async delete(slug: string, commentId: string, userId: string): Promise<void> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError('Comment not found', { slug, commentId });
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError('Only the comment author may delete it', { commentId, userId });
    }
    await this.comments.delete(comment.id);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found', { slug });
    }
    return article;
  }

  private async view(comment: CommentRecord, viewerId?: string): Promise<CommentResponse> {
    const author = await this.requireAuthor(comment.authorId);
    const following = viewerId
      ? await this.profiles.isFollowing(viewerId, author.id)
      : false;
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following,
      },
    };
  }

  private async requireAuthor(authorId: string): Promise<UserRecord> {
    const author = await this.users.findById(authorId);
    if (!author) {
      throw new NotFoundError('Comment author not found', { authorId });
    }
    return author;
  }
}
