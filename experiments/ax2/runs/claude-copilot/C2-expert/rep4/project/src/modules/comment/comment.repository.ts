import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

/** A comment joined with its author. */
export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: true };
}>;

/**
 * Data-access layer for Comment records.
 */
export class CommentRepository {
  /**
   * List comments for an article, newest last.
   * @param articleId The article id.
   * @returns The comments with authors.
   */
  async listByArticle(articleId: number): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { articleId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Create a comment on an article.
   * @param articleId The article id.
   * @param authorId The comment author id.
   * @param body The comment body.
   * @returns The created comment with author.
   */
  async create(
    articleId: number,
    authorId: number,
    body: string,
  ): Promise<CommentWithAuthor> {
    return prisma.comment.create({
      data: { articleId, authorId, body },
      include: { author: true },
    });
  }

  /**
   * Find a comment by id.
   * @param id The comment id.
   * @returns The comment with author, or null.
   */
  async findById(id: number): Promise<CommentWithAuthor | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  /**
   * Delete a comment by id.
   * @param id The comment id.
   */
  async delete(id: number): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }
}
