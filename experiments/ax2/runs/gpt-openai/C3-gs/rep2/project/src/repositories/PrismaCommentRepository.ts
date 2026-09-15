import { Comment, PrismaClient } from '@prisma/client';
import {
  CommentRecord,
  CreateCommentData,
  ICommentRepository,
} from './ICommentRepository';

function toRecord(comment: Comment): CommentRecord {
  return comment;
}

export class PrismaCommentRepository implements ICommentRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Persists a comment. */
  public async create(data: CreateCommentData): Promise<CommentRecord> {
    return toRecord(await this.client.comment.create({ data }));
  }

  /** Finds a comment by ID. */
  public async findById(id: string): Promise<CommentRecord | null> {
    return this.client.comment.findUnique({ where: { id } });
  }

  /** Lists comments belonging to an article oldest first. */
  public async listByArticleId(articleId: string): Promise<ReadonlyArray<CommentRecord>> {
    return this.client.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Deletes a comment by ID. */
  public async delete(id: string): Promise<void> {
    await this.client.comment.delete({ where: { id } });
  }
}
