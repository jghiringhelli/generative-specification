import { Prisma, PrismaClient } from '@prisma/client';
import { IArticleRepository, ArticleListResult } from './IArticleRepository';
import {
  ArticleEntity,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput
} from '../domain/types';

const articleInclude = { tags: { include: { tag: true } } } as const;

type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

/**
 * Map a Prisma article row (with tags) to a domain {@link ArticleEntity}.
 * @param row - The Prisma row.
 * @returns The domain entity.
 */
function toEntity(row: ArticleRow): ArticleEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    authorId: row.authorId,
    tagList: row.tags.map((t) => t.tag.name),
    favoritesCount: row.favoritesCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

/**
 * Prisma-backed driven adapter for {@link IArticleRepository}.
 */
export class PrismaArticleRepository implements IArticleRepository {
  /**
   * @param prisma - Shared Prisma client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    const row = await this.prisma.article.findUnique({ where: { slug }, include: articleInclude });
    return row ? toEntity(row) : null;
  }

  /** @inheritdoc */
  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    const where: Prisma.ArticleWhereInput = {};
    if (filter.tag) where.tags = { some: { tag: { name: filter.tag } } };
    if (filter.author) where.author = { username: filter.author };
    if (filter.favoritedBy) where.favorites = { some: { user: { username: filter.favoritedBy } } };
    return this.query(where, filter.limit, filter.offset);
  }

  /** @inheritdoc */
  async feed(authorIds: number[], filter: FeedFilter): Promise<ArticleListResult> {
    if (authorIds.length === 0) {
      return { articles: [], total: 0 };
    }
    return this.query({ authorId: { in: authorIds } }, filter.limit, filter.offset);
  }

  /**
   * Run a paginated article query with a total count.
   * @param where - Prisma filter.
   * @param limit - Page size.
   * @param offset - Page offset.
   * @returns The page and total.
   */
  private async query(
    where: Prisma.ArticleWhereInput,
    limit: number,
    offset: number
  ): Promise<ArticleListResult> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      this.prisma.article.count({ where })
    ]);
    return { articles: rows.map(toEntity), total };
  }

  /** @inheritdoc */
  async create(input: CreateArticleInput): Promise<ArticleEntity> {
    const row = await this.prisma.article.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        body: input.body,
        authorId: input.authorId,
        tags: {
          create: input.tagList.map((name) => ({
            tag: {
              connectOrCreate: { where: { name }, create: { name } }
            }
          }))
        }
      },
      include: articleInclude
    });
    return toEntity(row);
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateArticleInput): Promise<ArticleEntity> {
    const row = await this.prisma.article.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        body: input.body
      },
      include: articleInclude
    });
    return toEntity(row);
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  /** @inheritdoc */
  async addFavorite(userId: number, articleId: number): Promise<void> {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } }
    });
    if (existing) {
      return;
    }
    await this.prisma.$transaction([
      this.prisma.favorite.create({ data: { userId, articleId } }),
      this.prisma.article.update({
        where: { id: articleId },
        data: { favoritesCount: { increment: 1 } }
      })
    ]);
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, articleId: number): Promise<void> {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } }
    });
    if (!existing) {
      return;
    }
    await this.prisma.$transaction([
      this.prisma.favorite.delete({ where: { userId_articleId: { userId, articleId } } }),
      this.prisma.article.update({
        where: { id: articleId },
        data: { favoritesCount: { decrement: 1 } }
      })
    ]);
  }

  /** @inheritdoc */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const row = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } }
    });
    return row !== null;
  }

  /** @inheritdoc */
  async favoritesCount(articleId: number): Promise<number> {
    return this.prisma.favorite.count({ where: { articleId } });
  }
}
