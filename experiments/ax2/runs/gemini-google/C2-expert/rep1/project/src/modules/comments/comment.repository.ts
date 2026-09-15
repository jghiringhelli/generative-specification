import { Comment, User } from '@prisma/client';
import { prisma } from '../../db/prisma';

export type CommentWithAuthor = Comment & {
  author: User;
};

export interface CreateCommentDbData {
  body: string;
  articleId: string;
  authorId: string;
}

export interface ICommentRepository {
  create(data: CreateCommentDbData): Promise<CommentWithAuthor>;
  findById(id: number): Promise<CommentWithAuthor | null>;
  findByArticleId(articleId: string): Promise<CommentWithAuthor[]>;
  delete(id: number): Promise<void>;
}

export class CommentRepository implements ICommentRepository {
  async create(data: CreateCommentDbData): Promise<CommentWithAuthor> {
    return prisma.comment.create({
      data: {
        body: data.body,
        articleId: data.articleId,
        authorId: data.authorId
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

  async findByArticleId(articleId: string): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { articleId },
      include: {
        author: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.comment.delete({
      where: { id }
    });
  }
}
