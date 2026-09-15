import { ArticleRepositoryPort } from "../articles/article.repository";
import { ForbiddenError, NotFoundError } from "../errors/application-error";
import { FollowRepositoryPort } from "../profiles/follow.repository";
import { CommentRepositoryPort } from "./comment.repository";
import { CommentRecord, CommentResponse } from "./comment.types";

export class CommentService {
  public constructor(
    private readonly comments: CommentRepositoryPort,
    private readonly articles: ArticleRepositoryPort,
    private readonly follows: FollowRepositoryPort
  ) {}

  /** Lists all comments for an existing article. */
  public async list(slug: string, currentUserId?: number): Promise<CommentResponse[]> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("Article does not exist");
    }
    const comments = await this.comments.list(article.id);
    return Promise.all(comments.map((comment) => this.toResponse(comment, currentUserId)));
  }

  /** Adds a comment to an existing article. */
  public async create(
    slug: string,
    authorId: number,
    body: string
  ): Promise<CommentResponse> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("Article does not exist");
    }
    return this.toResponse(await this.comments.create(article.id, authorId, body), authorId);
  }

  /** Deletes a comment when the requester is its author. */
  public async delete(slug: string, commentId: number, userId: number): Promise<void> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("Article does not exist");
    }
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment does not exist");
    }
    if (comment.articleId !== article.id) {
      throw new NotFoundError("Comment does not exist");
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenError();
    }
    await this.comments.delete(commentId);
  }

  private async toResponse(
    comment: CommentRecord,
    currentUserId?: number
  ): Promise<CommentResponse> {
    const following = currentUserId
      ? await this.follows.isFollowing(currentUserId, comment.authorId)
      : false;
    return {
      id: comment.id,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      body: comment.body,
      author: { ...comment.author, following }
    };
  }
}
