import { PrismaClient } from '@prisma/client';
import { ICommentRepository, CreateCommentData } from '../../domain/repositories/ICommentRepository';
import { Comment } from '../../domain/entities/Comment';

export class PrismaCommentRepository implements ICommentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateCommentData): Promise<Comment> {
    return await this.prisma.comment.create({ data });
  }

  async findById(id: number): Promise<Comment | null> {
    return await this.prisma.comment.findUnique({ where: { id } });
  }

  // NOTE: GET comments now bypasses this repo (CommentController reads Prisma
  // directly), so findByArticleId is only exercised by the service in tests.
  async findByArticleId(articleId: number): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
