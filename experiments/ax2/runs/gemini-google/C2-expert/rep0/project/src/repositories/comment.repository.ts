import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma.client';

const commentIncludeAuthor = {
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true
    }
  }
} as const;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentIncludeAuthor;
}>;

export interface ICommentRepository {
  create(articleId: number, authorId: number, body: string): Promise<CommentWithAuthor>;
  findById(id: number): Promise<CommentWithAuthor | null>;
  findByArticleId(articleId: number): Promise<CommentWithAuthor[]>;
  delete(id: number): Promise<void>;
}

export class CommentRepository implements ICommentRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  /**
   * Creates a comment on an article.
   */
  public async create(
    articleId: number,
    authorId: number,
    body: string
  ): Promise<CommentWithAuthor> {
    return this.db.comment.create({
      data: {
        body,
        articleId,
        authorId
      },
      include: commentIncludeAuthor
    });
  }

  /**
   * Finds a comment by its primary key ID.
   */
  public async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.db.comment.findUnique({
      where: { id },
      include: commentIncludeAuthor
    });
  }

  /**
   * Retrieves all comments for a given article ordered by creation time.
   */
  public async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return this.db.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
      include: commentIncludeAuthor
    });
  }

  /**
   * Deletes a comment by ID.
   */
  public async delete(id: number): Promise<void> {
    await this.db.comment.delete({
      where: { id }
    });
  }
}
