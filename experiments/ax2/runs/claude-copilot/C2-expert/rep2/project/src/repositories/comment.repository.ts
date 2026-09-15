import { Comment, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CommentWithAuthor extends Comment {
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

const commentInclude = {
  author: { select: { id: true, username: true, bio: true, image: true } }
} satisfies Prisma.CommentInclude;

/**
 * Data-access adapter for the Comment aggregate.
 */
export class CommentRepository {
  /** Lists comments for an article, newest first. */
  async listByArticle(articleId: number): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { articleId },
      include: commentInclude,
      orderBy: { createdAt: 'desc' }
    }) as Promise<CommentWithAuthor[]>;
  }

  /** Finds a comment by id. */
  async findById(id: number): Promise<CommentWithAuthor | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: commentInclude
    }) as Promise<CommentWithAuthor | null>;
  }

  /** Persists a new comment. */
  async create(data: {
    body: string;
    authorId: number;
    articleId: number;
  }): Promise<CommentWithAuthor> {
    return prisma.comment.create({
      data,
      include: commentInclude
    }) as Promise<CommentWithAuthor>;
  }

  /** Deletes a comment by id. */
  async delete(id: number): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }
}
