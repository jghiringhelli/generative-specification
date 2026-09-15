import { ArticleNotFoundError } from '../articles/article.errors';
import { CommentForbiddenError, CommentNotFoundError } from './comment.errors';
import { CommentRepositoryPort } from './comment.repository';
import { CommentRecord, CommentResponse } from './comment.types';

export class CommentService {
  public constructor(private readonly comments: CommentRepositoryPort) {}

  /** Lists comments belonging to an article. */
  public async list(slug: string, currentUserId?: number): Promise<ReadonlyArray<CommentResponse>> {
    const articleId = await this.requireArticleId(slug);
    const comments = await this.comments.list(articleId, currentUserId);
    return comments.map((comment) => this.toResponse(comment));
  }

  /** Adds a comment to an article. */
  public async create(slug: string, authorId: number, body: string): Promise<CommentResponse> {
    const articleId = await this.requireArticleId(slug);
    return this.toResponse(await this.comments.create(articleId, authorId, body));
  }

  /** Deletes a comment when requested by its author. */
  public async delete(slug: string, commentId: number, userId: number): Promise<void> {
    await this.requireArticleId(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment) throw new CommentNotFoundError(commentId);
    if (comment.authorId !== userId) throw new CommentForbiddenError(commentId);
    await this.comments.delete(commentId);
  }

  private async requireArticleId(slug: string): Promise<number> {
    const articleId = await this.comments.findArticleId(slug);
    if (articleId === null) throw new ArticleNotFoundError(slug);
    return articleId;
  }

  private toResponse(comment: CommentRecord): CommentResponse {
    return {
      id: comment.id, createdAt: comment.createdAt, updatedAt: comment.updatedAt, body: comment.body,
      author: {
        username: comment.author.username, bio: comment.author.bio, image: comment.author.image,
        following: comment.author.followers.length > 0,
      },
    };
  }
}
