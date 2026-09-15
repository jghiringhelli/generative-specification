import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { CommentRecord, ICommentRepository } from '../repositories/ICommentRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository, UserRecord } from '../repositories/IUserRepository';

export interface CommentView {
  readonly id: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  public async list(slug: string, viewerId?: string): Promise<readonly CommentView[]> {
    const article = await this.requireArticle(slug);
    const comments = await this.comments.listByArticle(article.id);
    return Promise.all(comments.map((comment) => this.toView(comment, viewerId)));
  }

  public async create(slug: string, authorId: string, body: string): Promise<CommentView> {
    const article = await this.requireArticle(slug);
    return this.toView(await this.comments.create(article.id, authorId, body), authorId);
  }

  public async delete(slug: string, commentId: string, userId: string): Promise<void> {
    const article = await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundError(`Comment '${commentId}' was not found`);
    }
    if (comment.authorId !== userId) throw new ForbiddenError('Only the author may delete this comment');
    await this.comments.delete(comment.id);
  }

  private async requireArticle(slug: string) {
    const article = await this.articles.findBySlug(slug);
    if (!article) throw new NotFoundError(`Article '${slug}' was not found`);
    return article;
  }

  private async toView(comment: CommentRecord, viewerId?: string): Promise<CommentView> {
    const author = await this.requireAuthor(comment.authorId);
    const following = viewerId ? await this.profiles.isFollowing(viewerId, author.id) : false;
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: { username: author.username, bio: author.bio, image: author.image, following },
    };
  }

  private async requireAuthor(id: string): Promise<UserRecord> {
    const author = await this.users.findById(id);
    if (!author) throw new NotFoundError('Comment author was not found');
    return author;
  }
}
