import { ForbiddenError, NotFoundError } from "../errors";
import { CommentRepositoryPort } from "./comment.repository";
import { CommentRecord, CommentResponse } from "./comment.types";

export class CommentService {
  public constructor(private readonly comments: CommentRepositoryPort) {}

  /** Lists comments for an article visible to the current visitor. */
  public async list(slug: string, userId?: number): Promise<ReadonlyArray<CommentResponse>> {
    const articleId = await this.requireArticle(slug);
    return Promise.all((await this.comments.list(articleId)).map((comment) => this.toResponse(comment, userId)));
  }

  /** Adds a comment to an article. */
  public async create(slug: string, body: string, userId: number): Promise<CommentResponse> {
    const articleId = await this.requireArticle(slug);
    return this.toResponse(await this.comments.create(articleId, userId, body), userId);
  }

  /** Deletes a comment owned by the current user. */
  public async delete(slug: string, commentId: number, userId: number): Promise<void> {
    const articleId = await this.requireArticle(slug);
    const comment = await this.comments.findById(commentId);
    if (!comment || comment.articleId !== articleId) {
      throw new NotFoundError("Comment not found");
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError();
    }
    await this.comments.delete(commentId);
  }

  private async requireArticle(slug: string): Promise<number> {
    const articleId = await this.comments.findArticleId(slug);
    if (articleId === null) throw new NotFoundError("Article not found");
    return articleId;
  }

  private async toResponse(comment: CommentRecord, userId?: number): Promise<CommentResponse> {
    const following = userId === undefined
      ? false
      : await this.comments.isFollowing(userId, comment.authorId);
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: { ...comment.author, following }
    };
  }
}
