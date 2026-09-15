import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../prisma';
import {
  ICommentRepository,
  CommentRecord,
  CreateCommentData,
} from './comment-repository.interface';

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  articleId: true,
  authorId: true,
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true,
    },
  },
} as const;

/**
 * Prisma implementation of the Comment repository.
 */
export class CommentRepository implements ICommentRepository {
  private readonly db: PrismaClient;

  /**
   * Constructs the CommentRepository.
   *
   * @param {PrismaClient} [dbClient=defaultPrisma] - Injected Prisma client
   */
  constructor(dbClient: PrismaClient = defaultPrisma) {
    this.db = dbClient;
  }

  /**
   * Creates a comment.
   *
   * @param {CreateCommentData} data - Comment creation parameters
   * @returns {Promise<CommentRecord>} Created comment
   */
  public async create(data: CreateCommentData): Promise<CommentRecord> {
    const comment = await this.db.comment.create({
      data: {
        body: data.body,
        articleId: data.articleId,
        authorId: data.authorId,
      },
      select: commentSelect,
    });

    return comment;
  }

  /**
   * Finds a comment by ID.
   *
   * @param {number} id - Comment ID
   * @returns {Promise<CommentRecord | null>} Comment or null
   */
  public async findById(id: number): Promise<CommentRecord | null> {
    const comment = await this.db.comment.findUnique({
      where: { id },
      select: commentSelect,
    });

    return comment;
  }

  /**
   * Finds all comments for an article ordered by createdAt descending.
   *
   * @param {string} articleId - Article ID
   * @returns {Promise<readonly CommentRecord[]>} Comments array
   */
  public async findByArticleId(articleId: string): Promise<readonly CommentRecord[]> {
    const comments = await this.db.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
      select: commentSelect,
    });

    return comments;
  }

  /**
   * Deletes a comment by ID.
   *
   * @param {number} id - Comment ID
   * @returns {Promise<void>}
   */
  public async delete(id: number): Promise<void> {
    await this.db.comment.delete({
      where: { id },
    });
  }
}
