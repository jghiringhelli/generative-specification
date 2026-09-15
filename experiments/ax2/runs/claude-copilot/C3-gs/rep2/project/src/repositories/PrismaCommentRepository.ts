import { PrismaClient } from '@prisma/client';
import { ICommentRepository } from './ICommentRepository';
import { Comment, CreateCommentInput } from '../domain/types';

/**
 * Prisma-backed driven adapter implementing {@link ICommentRepository}.
 */
export class PrismaCommentRepository implements ICommentRepository {
  private readonly prisma: PrismaClient;

  /**
   * @param prisma - Injected Prisma client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** @inheritdoc */
  async create(input: CreateCommentInput): Promise<Comment> {
    return this.prisma.comment.create({ data: input });
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  async listByArticle(articleId: number): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
