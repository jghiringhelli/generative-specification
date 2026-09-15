import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const commentRelations = { author: { include: { followers: true } } } satisfies Prisma.CommentInclude;
export type CommentRecord = Prisma.CommentGetPayload<{ include: typeof commentRelations }>;

export class CommentRepository {
  /** Checks whether an article slug exists. */
  public async articleExists(slug: string): Promise<boolean> {
    return (await prisma.article.count({ where: { slug } })) > 0;
  }

  /** Lists comments on an article. */
  public list(slug: string): Promise<CommentRecord[]> {
    return prisma.comment.findMany({ where: { article: { slug } }, include: commentRelations, orderBy: { createdAt: 'asc' } });
  }

  /** Creates a comment on an article. */
  public create(slug: string, authorId: number, body: string): Promise<CommentRecord> {
    return prisma.comment.create({ data: { body, authorId, article: { connect: { slug } } }, include: commentRelations });
  }

  /** Finds a comment belonging to an article. */
  public findByArticle(id: number, slug: string): Promise<CommentRecord | null> {
    return prisma.comment.findFirst({ where: { id, article: { slug } }, include: commentRelations });
  }

  /** Deletes a comment by id. */
  public async delete(id: number): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }
}
