import { PrismaClient, Prisma } from '@prisma/client';

/** Article row joined with author, favourite state and counts. */
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: true;
    favorites: true;
    _count: { select: { favorites: true } };
  };
}>;

/** Filters for the article list endpoint. */
export interface ArticleListFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

/** Fields required to persist a new article. */
export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: number;
}

/** Mutable article fields on update. */
export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

const INCLUDE = {
  author: true,
  favorites: true,
  _count: { select: { favorites: true } }
} as const;

/**
 * Persistence adapter for {@link Article}. The only place `prisma.article`,
 * `prisma.favorite` (article favouriting) and tag aggregation are touched.
 */
export class ArticleRepository {
  /** @param prisma injected Prisma client */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Lists articles matching the given filters, newest first.
   * @param filters tag/author/favorited plus pagination
   * @returns matching articles with relations
   */
  list(filters: ArticleListFilters): Promise<ArticleWithRelations[]> {
    return this.prisma.article.findMany({
      where: this.buildWhere(filters),
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset
    });
  }

  /**
   * Counts articles matching the given filters (ignores pagination).
   * @param filters tag/author/favorited filters
   * @returns the total match count
   */
  count(filters: ArticleListFilters): Promise<number> {
    return this.prisma.article.count({ where: this.buildWhere(filters) });
  }

  /**
   * Lists feed articles authored by the given user ids, newest first.
   * @param authorIds followed author ids
   * @param limit page size
   * @param offset page offset
   * @returns matching articles with relations
   */
  listFeed(authorIds: number[], limit: number, offset: number): Promise<ArticleWithRelations[]> {
    return this.prisma.article.findMany({
      where: { authorId: { in: authorIds } },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Counts feed articles authored by the given user ids.
   * @param authorIds followed author ids
   * @returns the total feed count
   */
  countFeed(authorIds: number[]): Promise<number> {
    return this.prisma.article.count({ where: { authorId: { in: authorIds } } });
  }

  /**
   * Finds a single article by slug.
   * @param slug the article slug
   * @returns the article with relations, or null
   */
  findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({ where: { slug }, include: INCLUDE });
  }

  /**
   * Persists a new article.
   * @param data the article fields
   * @returns the created article with relations
   */
  create(data: CreateArticleData): Promise<ArticleWithRelations> {
    return this.prisma.article.create({ data, include: INCLUDE });
  }

  /**
   * Updates an article by id.
   * @param id the article id
   * @param data the mutable fields
   * @returns the updated article with relations
   */
  update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations> {
    return this.prisma.article.update({ where: { id }, data, include: INCLUDE });
  }

  /**
   * Deletes an article by id.
   * @param id the article id
   */
  async delete(id: number): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  /**
   * Adds a favourite relationship idempotently.
   * @param userId the favouriting user id
   * @param articleId the article id
   */
  async favorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {}
    });
  }

  /**
   * Removes a favourite relationship idempotently.
   * @param userId the favouriting user id
   * @param articleId the article id
   */
  async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, articleId } });
  }

  /**
   * Returns all distinct tag strings across every article.
   * @returns a de-duplicated list of tags
   */
  async allTags(): Promise<string[]> {
    const rows = await this.prisma.article.findMany({ select: { tagList: true } });
    const unique = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tagList) {
        unique.add(tag);
      }
    }
    return [...unique];
  }

  /**
   * Builds the Prisma where clause from list filters.
   * @param filters the requested filters
   * @returns a Prisma.ArticleWhereInput
   */
  private buildWhere(filters: ArticleListFilters): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};
    if (filters.tag) {
      where.tagList = { has: filters.tag };
    }
    if (filters.author) {
      where.author = { username: filters.author };
    }
    if (filters.favorited) {
      where.favorites = { some: { user: { username: filters.favorited } } };
    }
    return where;
  }
}
