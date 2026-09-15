import { PrismaClient } from '@prisma/client';
import {
  CommentEntity,
  CreateCommentData,
  ICommentRepository,
} from './ICommentRepository';
import { prisma as defaultPrisma } from '../config/prisma';

export class CommentRepository implements ICommentRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  async findById(id: string): Promise<CommentEntity | null> {
    return this.db.comment.findUnique({
      where: { id },
    });
  }

  async findByArticleSlug(slug: string): Promise<CommentEntity[]> {
    return this.db.comment.findMany({
      where: {
        article: { slug },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateCommentData): Promise<CommentEntity> {
    return this.db.comment.create({
      data: {
        body: data.body,
        authorId: data.authorId,
        articleId: data.articleId,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.comment.delete({
      where: { id },
    });
  }
}
