import { prisma } from '../config/prisma';
import {
  CommentWithAuthor,
  CreateCommentData,
  ICommentRepository,
} from './ICommentRepository';

/**
 * Prisma-backed implementation of the comment persistence port.
 */
export class CommentRepository implements ICommentRepository {
  /** @inheritdoc */
  create(data: CreateCommentData): Promise<CommentWithAuthor> {
    return prisma.comment.create({
      data,
      include: { author: true },
    });
  }

  /** @inheritdoc */
  findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { articleId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** @inheritdoc */
  findById(id: number): Promise<CommentWithAuthor | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }
}
