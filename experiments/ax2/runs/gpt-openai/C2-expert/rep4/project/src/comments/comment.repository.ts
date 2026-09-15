import { Comment, Prisma, PrismaClient } from "@prisma/client";

const commentRelations = {
  author: { include: { followers: true } }
} satisfies Prisma.CommentInclude;

export type CommentRecord = Prisma.CommentGetPayload<{ include: typeof commentRelations }>;

export interface ICommentRepository {
  findArticleId(slug: string): Promise<number | null>;
  list(articleId: number): Promise<CommentRecord[]>;
  create(articleId: number, authorId: number, body: string): Promise<CommentRecord>;
  findById(id: number): Promise<Comment | null>;
  delete(id: number): Promise<void>;
}

export class CommentRepository implements ICommentRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async findArticleId(slug: string): Promise<number | null> {
    const article = await this.database.article.findUnique({ where: { slug }, select: { id: true } });
    return article?.id ?? null;
  }

  public list(articleId: number): Promise<CommentRecord[]> {
    return this.database.comment.findMany({
      where: { articleId },
      include: commentRelations,
      orderBy: { createdAt: "asc" }
    });
  }

  public create(articleId: number, authorId: number, body: string): Promise<CommentRecord> {
    return this.database.comment.create({
      data: { articleId, authorId, body },
      include: commentRelations
    });
  }

  public findById(id: number): Promise<Comment | null> {
    return this.database.comment.findUnique({ where: { id } });
  }

  public async delete(id: number): Promise<void> {
    await this.database.comment.delete({ where: { id } });
  }
}
