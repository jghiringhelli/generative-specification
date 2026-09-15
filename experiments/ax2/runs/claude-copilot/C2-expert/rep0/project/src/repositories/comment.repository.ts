import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

/** Comment record joined with its author. */
export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: true };
}>;

const COMMENT_INCLUDE = { author: true } as const;

/**
 * Persistence adapter for {@link Comment} entities.
 */
export class CommentRepository {
  private readonly client = prisma;

  /**
   * Creates a comment on an article.
   * @param articleId The article id.
   * @param authorId The comment author id.
   * @param body The comment body.
   * @returns The created comment with its author.
   */
  async create(
    articleId: number,
    authorId: number,
    body: string
  ): Promise<CommentWithAuthor> {
    return this.client.comment.create({
      data: { articleId, authorId, body },
      include: COMMENT_INCLUDE
    });
  }

  /**
   * Lists comments for an article, newest first.
   * @param articleId The article id.
   * @returns The comments with authors.
   */
  async findByArticle(articleId: number): Promise<CommentWithAuthor[]> {
    return this.client.comment.findMany({
      where: { articleId },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Finds a comment by id.
   * @param id The comment id.
   * @returns The comment with its author or `null`.
   */
  async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.client.comment.findUnique({
      where: { id },
      include: COMMENT_INCLUDE
    });
  }

  /**
   * Deletes a comment by id.
   * @param id The comment id.
   */
  async delete(id: number): Promise<void> {
    await this.client.comment.delete({ where: { id } });
  }
}
