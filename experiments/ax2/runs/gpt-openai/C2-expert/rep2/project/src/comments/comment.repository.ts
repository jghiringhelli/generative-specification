import { PrismaClient } from '@prisma/client';
import { CommentRecord } from './comment.types';

export interface CommentRepositoryPort {
  findArticleId(slug: string): Promise<number | null>;
  list(articleId: number, currentUserId?: number): Promise<ReadonlyArray<CommentRecord>>;
  create(articleId: number, authorId: number, body: string): Promise<CommentRecord>;
  findById(id: number): Promise<CommentRecord | null>;
  delete(id: number): Promise<void>;
}

export class CommentRepository implements CommentRepositoryPort {
  public constructor(private readonly database: PrismaClient) {}

  public async findArticleId(slug: string): Promise<number | null> {
    const article = await this.database.article.findUnique({ where: { slug }, select: { id: true } });
    return article?.id ?? null;
  }

  public async list(articleId: number, currentUserId?: number): Promise<ReadonlyArray<CommentRecord>> {
    const comments = await this.database.comment.findMany({
      where: { articleId }, include: this.authorRelation(currentUserId), orderBy: { createdAt: 'asc' },
    });
    return comments as unknown as CommentRecord[];
  }

  public async create(articleId: number, authorId: number, body: string): Promise<CommentRecord> {
    const comment = await this.database.comment.create({
      data: { articleId, authorId, body }, include: this.authorRelation(authorId),
    });
    return comment as unknown as CommentRecord;
  }

  public async findById(id: number): Promise<CommentRecord | null> {
    const comment = await this.database.comment.findUnique({
      where: { id }, include: this.authorRelation(),
    });
    return comment as unknown as CommentRecord | null;
  }

  public async delete(id: number): Promise<void> {
    await this.database.comment.delete({ where: { id } });
  }

  private authorRelation(currentUserId?: number) {
    return {
      author: { include: { followers: { where: { followerId: currentUserId ?? -1 } } } },
    };
  }
}
