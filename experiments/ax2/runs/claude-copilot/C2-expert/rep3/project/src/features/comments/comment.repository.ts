import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** Comment with its author relation for API responses. */
export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: true };
}>;

/**
 * Data-access layer for Comment entities and their parent articles.
 */
export class CommentRepository {
  /**
   * Finds an article id by slug.
   * @param slug the article slug
   * @returns the article id or null when not found
   */
  async findArticleIdBySlug(slug: string): Promise<number | null> {
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    return article?.id ?? null;
  }

  /**
   * Lists comments for an article, newest first.
   * @param articleId the parent article id
   * @returns the comments with authors
   */
  async listByArticle(articleId: number): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { articleId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a comment on an article.
   * @param articleId the parent article id
   * @param authorId the comment author id
   * @param body the comment body
   * @returns the created comment with author
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
   * Finds a comment by id.
   * @param id the comment id
   * @returns the comment with author or null
   */
  async findById(id: number): Promise<CommentWithAuthor | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  /**
   * Deletes a comment by id.
   * @param id the comment id
   */
  async delete(id: number): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }
}
