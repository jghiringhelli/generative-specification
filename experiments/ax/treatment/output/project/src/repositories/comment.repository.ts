import { PrismaClient, Comment } from '@prisma/client';

/**
 * Comment with author relation loaded.
 */
export type CommentWithAuthor = Comment & {
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
  };
};

/**
 * Comment repository interface.
 */
export interface ICommentRepository {
  findById(id: number): Promise<CommentWithAuthor | null>;
  findByArticleSlug(slug: string): Promise<CommentWithAuthor[]>;
  create(data: {
    body: string;
    authorId: number;
    articleId: number;
  }): Promise<CommentWithAuthor>;
  delete(id: number): Promise<void>;
}

/**
 * Prisma implementation of comment repository.
 */
export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private readonly includeAuthor = {
    author: {
      select: {
        id: true,
        username: true,
        bio: true,
        image: true
      }
    }
  };

  async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: this.includeAuthor
    });
  }

  async findByArticleSlug(slug: string): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: {
        article: {
          slug
        }
      },
      include: this.includeAuthor,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async create(data: {
    body: string;
    authorId: number;
    articleId: number;
  }): Promise<CommentWithAuthor> {
    return this.prisma.comment.create({
      data,
      include: this.includeAuthor
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id }
    });
  }
}
