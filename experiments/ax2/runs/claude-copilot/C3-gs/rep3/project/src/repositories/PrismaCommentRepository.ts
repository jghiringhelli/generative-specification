import { PrismaClient } from '@prisma/client';
import { ICommentRepository } from './ICommentRepository';
import { Comment, CreateCommentInput } from '../types/domain';

/** PrismaClient-backed implementation of {@link ICommentRepository}. */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCommentInput): Promise<Comment> {
    return this.prisma.comment.create({ data: input });
  }

  async findById(id: number): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async findByArticleId(articleId: number): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
