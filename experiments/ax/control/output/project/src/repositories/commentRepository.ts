import { PrismaClient, Comment, User } from '@prisma/client';

export interface CommentWithRelations extends Comment {
  author: User;
}

export class CommentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    articleId: string,
    authorId: string,
    body: string
  ): Promise<CommentWithRelations> {
    return this.prisma.comment.create({
      data: {
        body,
        authorId,
        articleId
      },
      include: {
        author: true
      }
    }) as Promise<CommentWithRelations>;
  }

  async findByArticleId(articleId: string): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      include: {
        author: true
      },
      orderBy: { createdAt: 'desc' }
    }) as Promise<CommentWithRelations[]>;
  }

  async findById(id: string): Promise<CommentWithRelations | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true
      }
    }) as Promise<CommentWithRelations | null>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({
      where: { id }
    });
  }
}
