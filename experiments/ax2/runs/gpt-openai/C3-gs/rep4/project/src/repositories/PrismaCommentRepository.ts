import type { PrismaClient } from '@prisma/client';
import type {
  CommentRecord,
  ICommentRepository,
} from './ICommentRepository';

export class PrismaCommentRepository implements ICommentRepository {
  public constructor(private readonly database: PrismaClient) {}

  /** Creates a comment on an article. */
  public create(
    articleId: string,
    authorId: string,
    body: string,
  ): Promise<CommentRecord> {
    return this.database.comment.create({
      data: { articleId, authorId, body },
      include: { author: true },
    });
  }

  /** Finds a comment by identifier. */
  public findById(id: string): Promise<CommentRecord | null> {
    return this.database.comment.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  /** Lists comments for an article in creation order. */
  public listByArticle(articleId: string): Promise<ReadonlyArray<CommentRecord>> {
    return this.database.comment.findMany({
      where: { articleId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Deletes a comment. */
  public async delete(id: string): Promise<void> {
    await this.database.comment.delete({ where: { id } });
  }
}
