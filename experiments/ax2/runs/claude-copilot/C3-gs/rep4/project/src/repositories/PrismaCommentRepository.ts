import { PrismaClient } from '@prisma/client';
import { ICommentRepository } from './ICommentRepository';
import { CommentWithAuthor, CreateCommentData } from '../domain/entities';

type CommentRow = {
  id: number;
  body: string;
  articleId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    bio: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

function toCommentWithAuthor(row: CommentRow): CommentWithAuthor {
  return {
    id: row.id,
    body: row.body,
    articleId: row.articleId,
    authorId: row.authorId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: row.author,
  };
}

/**
 * Prisma-backed driven adapter implementing {@link ICommentRepository}.
 */
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const row = await this.prisma.comment.create({
      data: { body: data.body, articleId: data.articleId, authorId: data.authorId },
      include: { author: true },
    });
    return toCommentWithAuthor(row);
  }

  async findById(id: number): Promise<CommentWithAuthor | null> {
    const row = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
    return row ? toCommentWithAuthor(row) : null;
  }

  async listByArticle(articleId: string): Promise<CommentWithAuthor[]> {
    const rows = await this.prisma.comment.findMany({
      where: { articleId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toCommentWithAuthor);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
