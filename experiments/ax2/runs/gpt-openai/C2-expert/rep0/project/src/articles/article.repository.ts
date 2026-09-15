import { Prisma, PrismaClient } from "@prisma/client";
import {
  ArticleFilters,
  ArticleRecord,
  CreateArticleData,
  UpdateArticleData
} from "./article.types";

const articleInclude = {
  author: { select: { id: true, username: true, bio: true, image: true } },
  tags: { select: { name: true } },
  favorites: { select: { userId: true } }
} satisfies Prisma.ArticleInclude;

export interface ArticleRepositoryPort {
  list(filters: ArticleFilters): Promise<readonly [ReadonlyArray<ArticleRecord>, number]>;
  feed(userId: number, filters: ArticleFilters): Promise<readonly [ReadonlyArray<ArticleRecord>, number]>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  isFollowing(userId: number, authorId: number): Promise<boolean>;
  create(authorId: number, slug: string, data: CreateArticleData): Promise<ArticleRecord>;
  update(id: number, slug: string | undefined, data: UpdateArticleData): Promise<ArticleRecord>;
  delete(id: number): Promise<void>;
  favorite(userId: number, articleId: number): Promise<void>;
  unfavorite(userId: number, articleId: number): Promise<void>;
}

export class ArticleRepository implements ArticleRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Lists articles matching filters and returns the total count. */
  public async list(filters: ArticleFilters) {
    return this.findMany(this.where(filters), filters);
  }

  /** Lists articles written by users followed by the current user. */
  public async feed(userId: number, filters: ArticleFilters) {
    const where: Prisma.ArticleWhereInput = {
      ...this.where(filters),
      author: { followers: { some: { followerId: userId } } }
    };
    return this.findMany(where, filters);
  }

  /** Finds an article by slug. */
  public findBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.prisma.article.findUnique({ where: { slug }, include: articleInclude });
  }

  /** Determines whether a user follows an article author. */
  public async isFollowing(userId: number, authorId: number): Promise<boolean> {
    return (await this.prisma.follow.count({ where: { followerId: userId, followingId: authorId } })) > 0;
  }

  /** Creates an article and connects its tags. */
  public create(authorId: number, slug: string, data: CreateArticleData): Promise<ArticleRecord> {
    return this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId,
        tags: { connectOrCreate: (data.tagList ?? []).map((name) => ({ where: { name }, create: { name } })) }
      },
      include: articleInclude
    });
  }

  /** Updates an article's editable fields. */
  public update(id: number, slug: string | undefined, data: UpdateArticleData): Promise<ArticleRecord> {
    const { tagList, ...fields } = data;
    return this.prisma.article.update({
      where: { id },
      data: {
        ...fields,
        slug,
        tags: tagList === undefined
          ? undefined
          : {
              set: [],
              connectOrCreate: tagList.map((name) => ({ where: { name }, create: { name } }))
            }
      },
      include: articleInclude
    });
  }

  /** Deletes an article. */
  public async delete(id: number): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  /** Favorites an article idempotently. */
  public async favorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {}
    });
  }

  /** Unfavorites an article idempotently. */
  public async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, articleId } });
  }

  private where(filters: ArticleFilters): Prisma.ArticleWhereInput {
    return {
      tags: filters.tag ? { some: { name: filters.tag } } : undefined,
      author: filters.author ? { username: filters.author } : undefined,
      favorites: filters.favorited ? { some: { user: { username: filters.favorited } } } : undefined
    };
  }

  private async findMany(where: Prisma.ArticleWhereInput, filters: ArticleFilters) {
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
    return [articles, count] as const;
  }
}
