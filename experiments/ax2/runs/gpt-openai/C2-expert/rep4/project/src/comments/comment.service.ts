import { AppError, NotFoundError } from "../errors";
import { CommentRecord, ICommentRepository } from "./comment.repository";

export interface CommentResponse {
  readonly id: number;
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
  public constructor(private readonly comments: ICommentRepository) {}

  public async list(slug: string, viewerId?: number): Promise<CommentResponse[]> {
    const articleId = await this.articleId(slug);
    return (await this.comments.list(articleId)).map((comment) => this.toResponse(comment, viewerId));
  }

  public async create(slug: string, authorId: number, body: string): Promise<CommentResponse> {
    const articleId = await this.articleId(slug);
    return this.toResponse(await this.comments.create(articleId, authorId, body), authorId);
  }

  public async delete(slug: string, id: number, userId: number): Promise<void> {
    const articleId = await this.articleId(slug);
    const comment = await this.comments.findById(id);
    if (!comment || comment.articleId !== articleId) {
      throw new NotFoundError("Comment not found");
    }
    if (comment.authorId !== userId) {
      throw new AppError("Forbidden", 403);
    }
    await this.comments.delete(id);
  }

  private async articleId(slug: string): Promise<number> {
    const id = await this.comments.findArticleId(slug);
    if (!id) throw new NotFoundError("Article not found");
    return id;
  }

  private toResponse(comment: CommentRecord, viewerId?: number): CommentResponse {
    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: comment.author.followers.some((follow) => follow.followerId === viewerId)
      }
    };
  }
}
