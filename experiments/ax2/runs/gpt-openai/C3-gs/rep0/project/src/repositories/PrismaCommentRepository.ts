import { PrismaClient } from '@prisma/client';
import { CommentRecord, ICommentRepository } from './ICommentRepository';

export class PrismaCommentRepository implements ICommentRepository {
  public constructor(private readonly database: PrismaClient) {}

  public listByArticle(articleId: string): Promise<readonly CommentRecord[]> {
    return this.database.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  public findById(id: string): Promise<CommentRecord | null> {
    return this.database.comment.findUnique({ where: { id } });
  }

  public create(articleId: string, authorId: string, body: string): Promise<CommentRecord> {
    return this.database.comment.create({ data: { articleId, authorId, body } });
  }

  public async delete(id: string): Promise<void> {
    await this.database.comment.delete({ where: { id } });
  }
}
