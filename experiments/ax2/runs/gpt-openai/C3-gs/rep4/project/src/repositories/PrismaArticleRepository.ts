import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  ArticleFilters,
  ArticleRecord,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from './IArticleRepository';

const articleInclude = {
  author: true,
  tags: true,
  _count: { select: { favoritedBy: true } },
} satisfies Prisma.ArticleInclude;

export class PrismaArticleRepository implements IArticleRepository {
  public constructor(private readonly database: PrismaClient) {}

  /** Creates an article and connects or creates its tags. */
  public create(data: CreateArticleData): Promise<ArticleRecord> {
    return this.database.article.create({
      data: {
        title: data.title,
        description: data.description,
        body: data.body,
        slug: data.slug,
        authorId: data.authorId,
        tags: {
          connectOrCreate: data.tagList.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: articleInclude,
    });
  }

  /** Finds an article by slug. */
  public findBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.database.article.findUnique({ where: { slug }, include: articleInclude });
  }

  /** Lists articles using RealWorld filters and pagination. */
  public list(filters: ArticleFilters): Promise<ReadonlyArray<ArticleRecord>> {
    return this.database.article.findMany({
      where: this.toWhere(filters),
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    });
  }

  /** Counts articles matching RealWorld filters. */
  public count(filters: ArticleFilters): Promise<number> {
    return this.database.article.count({ where: this.toWhere(filters) });
  }

  /** Lists articles authored by followed users. */
  public feed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ReadonlyArray<ArticleRecord>> {
    return this.database.article.findMany({
      where: { author: { followers: { some: { followerId: userId } } } },
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /** Counts articles authored by followed users. */
  public feedCount(userId: string): Promise<number> {
    return this.database.article.count({
      where: { author: { followers: { some: { followerId: userId } } } },
    });
  }

  /** Updates article fields. */
  public update(id: string, data: UpdateArticleData): Promise<ArticleRecord> {
    return this.database.article.update({
      where: { id },
      data,
      include: articleInclude,
    });
  }

  /** Deletes an article. */
  public async delete(id: string): Promise<void> {
    await this.database.article.delete({ where: { id } });
  }

  /** Favorites an article idempotently. */
  public async favorite(articleId: string, userId: string): Promise<ArticleRecord> {
    await this.database.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
    return (await this.findById(articleId))!;
  }

  /** Removes an article favorite idempotently. */
  public async unfavorite(articleId: string, userId: string): Promise<ArticleRecord> {
    await this.database.favorite.deleteMany({ where: { userId, articleId } });
    return (await this.findById(articleId))!;
  }

  /** Reports whether a user has favorited an article. */
  public async isFavorited(articleId: string, userId: string): Promise<boolean> {
    return Boolean(await this.database.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    }));
  }

  private findById(id: string): Promise<ArticleRecord | null> {
    return this.database.article.findUnique({ where: { id }, include: articleInclude });
  }

  private toWhere(filters: ArticleFilters): Prisma.ArticleWhereInput {
    return {
      ...(filters.tag && { tags: { some: { name: filters.tag } } }),
      ...(filters.author && { author: { username: filters.author } }),
      ...(filters.favorited && {
        favoritedBy: { some: { user: { username: filters.favorited } } },
      }),
    };
  }
}
