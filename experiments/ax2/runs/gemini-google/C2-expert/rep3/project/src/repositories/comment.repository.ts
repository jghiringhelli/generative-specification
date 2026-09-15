import { Comment, PrismaClient, User } from '@prisma/client';
import { getPrismaClient } from './prisma.client';

export type CommentWithAuthor = Comment & {
  author: User;
};

/**
 * Data access repository for comments.
 */
export class CommentRepository {
  private readonly prisma: PrismaClient;

  /**
   * Initializes CommentRepository.
   *
   * @param {PrismaClient} [prisma] Optional PrismaClient instance
   */
  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma;
  }

  /**
   * Creates a new comment on an article.
   *
   * @param {number} articleId Article identifier
   * @param {number} authorId Author user identifier
   * @param {string} body Comment content text
   * @returns {Promise<CommentWithAuthor>} Created comment with author
   */
  async create(articleId: number, authorId: number, body: string): Promise<CommentWithAuthor> {
    return this.prisma.comment.create({
      data: {
        body,
        articleId,
        authorId,
      },
      include: {
        author: true,
      },
    });
  }

  /**
   * Finds a comment by its ID.
   *
   * @param {number} id Comment identifier
   * @returns {Promise<CommentWithAuthor | null>} The comment or null
   */
  async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });
  }

  /**
   * Finds all comments for a given article ordered by creation time descending.
   *
   * @param {number} articleId Article identifier
   * @returns {Promise<CommentWithAuthor[]>} List of comments with authors
   */
  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      include: {
        author: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deletes a comment by ID.
   *
   * @param {number} id Comment identifier
   * @returns {Promise<void>}
   */
  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }
}
