import { Prisma, PrismaClient } from "@prisma/client";
import { CommentRecord } from "./comment.types";

const commentInclude = {
  author: { select: { username: true, bio: true, image: true } }
} satisfies Prisma.CommentInclude;

export interface CommentRepositoryPort {
  list(articleId: number): Promise<CommentRecord[]>;
  findById(id: number): Promise<CommentRecord | null>;
  create(articleId: number, authorId: number, body: string): Promise<CommentRecord>;
  delete(id: number): Promise<void>;
}

export class CommentRepository implements CommentRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Lists comments for an article in creation order. */
  public list(articleId: number): Promise<CommentRecord[]> {
    return this.prisma.comment.findMany({
      where: { articleId },
      include: commentInclude,
      orderBy: { createdAt: "asc" }
    });
  }

  /** Finds a comment by id. */
  public findById(id: number): Promise<CommentRecord | null> {
    return this.prisma.comment.findUnique({ where: { id }, include: commentInclude });
  }

  /** Persists a new article comment. */
  public create(articleId: number, authorId: number, body: string): Promise<CommentRecord> {
    return this.prisma.comment.create({
      data: { articleId, authorId, body },
      include: commentInclude
    });
  }

  /** Deletes a comment. */
  public async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
