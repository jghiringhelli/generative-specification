import { Prisma, PrismaClient } from "@prisma/client";
import {
  ArticleFilters,
  ArticleInput,
  ArticleRecord,
  ArticleUpdate
} from "./article.types";

const articleInclude = {
  author: { select: { id: true, username: true, bio: true, image: true } },
  tags: { select: { name: true } },
  favorites: { select: { userId: true } },
  _count: { select: { favorites: true } }
} satisfies Prisma.ArticleInclude;

export interface ArticleRepositoryPort {
  list(filters: ArticleFilters): Promise<{ articles: ArticleRecord[]; count: number }>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  create(authorId: number, slug: string, input: ArticleInput): Promise<ArticleRecord>;
  update(id: number, slug: string | undefined, input: ArticleUpdate): Promise<ArticleRecord>;
  delete(id: number): Promise<void>;
  favorite(userId: number, articleId: number): Promise<void>;
  unfavorite(userId: number, articleId: number): Promise<void>;
}

export class ArticleRepository implements ArticleRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Lists articles matching the supplied filters and pagination. */
  public async list(filters: ArticleFilters) {
    const where = this.buildWhere(filters);
    const [articles, count] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: "desc" },
        take: filters.limit,
        skip: filters.offset
      }),
      this.prisma.article.count({ where })
    ]);
    return { articles, count };
  }

  /** Finds an article by slug. */
  public findBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.prisma.article.findUnique({ where: { slug }, include: articleInclude });
  }

  /** Persists a new article and its tags. */
  public create(
    authorId: number,
    slug: string,
    input: ArticleInput
  ): Promise<ArticleRecord> {
    return this.prisma.article.create({
      data: {
        authorId,
        slug,
        title: input.title,
        description: input.description,
        body: input.body,
        tags: {
          connectOrCreate: (input.tagList ?? []).map((name) => ({
            where: { name },
            create: { name }
          }))
        }
      },
      include: articleInclude
    });
  }

  /** Updates an article's editable fields. */
  public update(
    id: number,
    slug: string | undefined,
    input: ArticleUpdate
  ): Promise<ArticleRecord> {
    const { tagList, ...fields } = input;
    return this.prisma.article.update({
      where: { id },
      data: {
        ...fields,
        slug,
        tags: tagList
          ? {
              set: [],
              connectOrCreate: tagList.map((name) => ({
                where: { name },
                create: { name }
              }))
            }
          : undefined
      },
      include: articleInclude
    });
  }

  /** Deletes an article. */
  public async delete(id: number): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  /** Idempotently favorites an article. */
  public async favorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {}
    });
  }

  /** Idempotently removes an article favorite. */
  public async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, articleId } });
  }

  private buildWhere(filters: ArticleFilters): Prisma.ArticleWhereInput {
    return {
      tags: filters.tag ? { some: { name: filters.tag } } : undefined,
      author: filters.author ? { username: filters.author } : undefined,
      favorites: filters.favorited
        ? { some: { user: { username: filters.favorited } } }
        : undefined,
      ...(filters.followedByUserId
        ? { author: { followers: { some: { followerId: filters.followedByUserId } } } }
        : {})
    };
  }
}
