import { Prisma, PrismaClient } from "@prisma/client";
import { CommentRecord } from "./comment.types";

const commentInclude = {
  author: { select: { username: true, bio: true, image: true } }
} satisfies Prisma.CommentInclude;

export interface CommentRepositoryPort {
  findArticleId(slug: string): Promise<number | null>;
  list(articleId: number): Promise<ReadonlyArray<CommentRecord>>;
  create(articleId: number, authorId: number, body: string): Promise<CommentRecord>;
  findById(id: number): Promise<(CommentRecord & { readonly articleId: number }) | null>;
  delete(id: number): Promise<void>;
  isFollowing(userId: number, authorId: number): Promise<boolean>;
}

export class CommentRepository implements CommentRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Finds an article identifier by slug. */
  public async findArticleId(slug: string): Promise<number | null> {
    const article = await this.prisma.article.findUnique({ where: { slug }, select: { id: true } });
    return article?.id ?? null;
  }

  /** Lists comments for an article. */
  public list(articleId: number): Promise<ReadonlyArray<CommentRecord>> {
    return this.prisma.comment.findMany({
      where: { articleId },
      include: commentInclude,
      orderBy: { createdAt: "asc" }
    });
  }

  /** Creates a comment on an article. */
  public create(articleId: number, authorId: number, body: string): Promise<CommentRecord> {
    return this.prisma.comment.create({
      data: { articleId, authorId, body },
      include: commentInclude
    });
  }

  /** Finds a comment by identifier. */
  public findById(id: number) {
    return this.prisma.comment.findUnique({ where: { id }, include: commentInclude });
  }

  /** Deletes a comment. */
  public async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  /** Determines whether one user follows another. */
  public async isFollowing(userId: number, authorId: number): Promise<boolean> {
    return (await this.prisma.follow.count({ where: { followerId: userId, followingId: authorId } })) > 0;
  }
}
