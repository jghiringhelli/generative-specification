import type { Prisma, PrismaClient } from '@prisma/client';
import type { CommentRecord, CreateCommentRecord, ICommentRepository } from './ICommentRepository';

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: { include: { followers: true } } };
}>;

export class PrismaCommentRepository implements ICommentRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Finds a comment by identifier. */
  public async findById(id: string, viewerId?: string): Promise<CommentRecord | null> {
    const comment = await this.client.comment.findUnique({ where: { id }, include: this.include });
    return comment ? this.map(comment, viewerId) : null;
  }

  /** Lists comments for one article in creation order. */
  public async listByArticleId(articleId: string, viewerId?: string): Promise<ReadonlyArray<CommentRecord>> {
    const comments = await this.client.comment.findMany({
      where: { articleId },
      include: this.include,
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((comment) => this.map(comment, viewerId));
  }

  /** Creates a comment. */
  public async create(data: CreateCommentRecord): Promise<CommentRecord> {
    const comment = await this.client.comment.create({ data, include: this.include });
    return this.map(comment, data.authorId);
  }

  /** Deletes a comment. */
  public async delete(id: string): Promise<void> {
    await this.client.comment.delete({ where: { id } });
  }

  private readonly include = { author: { include: { followers: true } } } as const;

  private map(comment: CommentWithAuthor, viewerId?: string): CommentRecord {
    return {
      id: comment.id,
      body: comment.body,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: viewerId
          ? comment.author.followers.some(({ followerId }) => followerId === viewerId)
          : false,
      },
    };
  }
}
