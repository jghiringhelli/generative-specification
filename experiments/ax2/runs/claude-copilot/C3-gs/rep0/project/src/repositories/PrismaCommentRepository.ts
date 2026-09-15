import { PrismaClient } from '@prisma/client';
import { ICommentRepository } from './ICommentRepository';
import { CommentEntity, CreateCommentInput } from '../domain/types';

/**
 * Prisma-backed driven adapter for {@link ICommentRepository}.
 */
export class PrismaCommentRepository implements ICommentRepository {
  /**
   * @param prisma - Shared Prisma client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findById(id: number): Promise<CommentEntity | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  async findByArticle(articleId: number): Promise<CommentEntity[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /** @inheritdoc */
  async create(input: CreateCommentInput): Promise<CommentEntity> {
    return this.prisma.comment.create({ data: input });
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
