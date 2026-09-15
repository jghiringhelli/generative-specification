import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type { IArticleRepository } from '../repositories/IArticleRepository';
import type {
  CommentRecord,
  ICommentRepository,
} from '../repositories/ICommentRepository';
import type { IProfileRepository } from '../repositories/IProfileRepository';
import type { ProfileResponse } from '../profiles/ProfileService';

export interface CommentResponse {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly body: string;
  readonly author: ProfileResponse;
}

export class CommentService {
  public constructor(
    private readonly comments: ICommentRepository,
    private readonly articles: IArticleRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /** Lists comments for an article. */
  public async list(slug: string, viewerId?: string): Promise<ReadonlyArray<CommentResponse>> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' was not found`);
    }
    const comments = await this.comments.listByArticle(article.id);
    return Promise.all(comments.map((comment) => this.toResponse(comment, viewerId)));
  }

  /** Creates a comment on an article. */
  public async create(
    slug: string,
    authorId: string,
    body: string,
  ): Promise<CommentResponse> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' was not found`);
    }
    return this.toResponse(
      await this.comments.create(article.id, authorId, body),
      authorId,
    );
  }

  /** Deletes a comment owned by the authenticated user. */
  public async delete(slug: string, commentId: string, userId: string): Promise<void> {
    const [article, comment] = await Promise.all([
      this.articles.findBySlug(slug),
      this.comments.findById(commentId),
    ]);
    if (!article || !comment || comment.articleId !== article.id) {
      throw new NotFoundError(`Comment '${commentId}' was not found`);
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError('Only the comment author may delete this comment');
    }
    await this.comments.delete(comment.id);
  }

  private async toResponse(
    comment: CommentRecord,
    viewerId?: string,
  ): Promise<CommentResponse> {
    const profile = await this.profiles.findByUsername(comment.author.username, viewerId);
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: profile?.following ?? false,
      },
    };
  }
}
