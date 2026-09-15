import { prisma } from '../lib/prisma';
import { Comment, User } from '@prisma/client';

export type CommentWithAuthor = Comment & {
  author: User;
};

export class CommentRepository {
  async create(articleId: number, authorId: number, body: string): Promise<CommentWithAuthor> {
    return prisma.comment.create({
      data: {
        body,
        articleId,
        authorId
      },
      include: {
        author: true
      }
    });
  }

  async findById(id: number): Promise<CommentWithAuthor | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        author: true
      }
    });
  }

  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true
      }
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.comment.delete({
      where: { id }
    });
  }
}

export const commentRepository = new CommentRepository();
