import { PrismaClient, Prisma } from '@prisma/client';

/** Comment row joined with its author. */
export type CommentWithAuthor = Prisma.CommentGetPayload<{ include: { author: true } }>;

/**
 * Persistence adapter for {@link Comment}. The only place `prisma.comment`
 * and comment-scoped article lookups are touched.
 */
export class CommentRepository {
  /** @param prisma injected Prisma client */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds an article id by slug.
   * @param slug the article slug
   * @returns the article id or null
   */
  async findArticleIdBySlug(slug: string): Promise<number | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });
    return article?.id ?? null;
  }

  /**
   * Lists comments for an article, newest first.
   * @param articleId the article id
   * @returns comments with their authors
   */
  listByArticle(articleId: number): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Creates a comment.
   * @param body the comment body
   * @param authorId the author id
   * @param articleId the article id
   * @returns the created comment with author
   */
  create(body: string, authorId: number, articleId: number): Promise<CommentWithAuthor> {
    return this.prisma.comment.create({
      data: { body, authorId, articleId },
      include: { author: true }
    });
  }

  /**
   * Finds a comment by id.
   * @param id the comment id
   * @returns the comment with author, or null
   */
  findById(id: number): Promise<CommentWithAuthor | null> {
    return this.prisma.comment.findUnique({ where: { id }, include: { author: true } });
  }

  /**
   * Deletes a comment by id.
   * @param id the comment id
   */
  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
