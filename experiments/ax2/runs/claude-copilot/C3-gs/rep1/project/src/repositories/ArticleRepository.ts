import { prisma } from '../config/prisma';
import {
  ArticleListFilter,
  ArticleWithRelations,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from './IArticleRepository';

const INCLUDE_RELATIONS = { author: true, tags: true } as const;

/**
 * Prisma-backed implementation of the article persistence port.
 */
export class ArticleRepository implements IArticleRepository {
  /** @inheritdoc */
  create(data: CreateArticleData): Promise<ArticleWithRelations> {
    const { tagList, ...fields } = data;
    return prisma.article.create({
      data: {
        ...fields,
        tags: {
          connectOrCreate: tagList.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: INCLUDE_RELATIONS,
    });
  }

  /** @inheritdoc */
  findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return prisma.article.findUnique({
      where: { slug },
      include: INCLUDE_RELATIONS,
    });
  }

  /**
   * Build the Prisma where clause for the given list filters.
   * @param filter - Tag/author/favorited filters.
   * @returns Prisma where clause.
   */
  private buildWhere(filter: ArticleListFilter) {
    const where: Record<string, unknown> = {};
    if (filter.tag) {
      where.tags = { some: { name: filter.tag } };
    }
    if (filter.author) {
      where.author = { username: filter.author };
    }
    if (filter.favorited) {
      where.favorites = { some: { user: { username: filter.favorited } } };
    }
    return where;
  }

  /** @inheritdoc */
  list(filter: ArticleListFilter): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: this.buildWhere(filter),
      include: INCLUDE_RELATIONS,
      orderBy: { createdAt: 'desc' },
      take: filter.limit,
      skip: filter.offset,
    });
  }

  /** @inheritdoc */
  count(filter: ArticleListFilter): Promise<number> {
    return prisma.article.count({ where: this.buildWhere(filter) });
  }

  /** @inheritdoc */
  feed(followedIds: number[], limit: number, offset: number): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: { authorId: { in: followedIds } },
      include: INCLUDE_RELATIONS,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /** @inheritdoc */
  countFeed(followedIds: number[]): Promise<number> {
    return prisma.article.count({ where: { authorId: { in: followedIds } } });
  }

  /** @inheritdoc */
  update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id },
      data,
      include: INCLUDE_RELATIONS,
    });
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await prisma.article.delete({ where: { id } });
  }

  /** @inheritdoc */
  async addFavorite(userId: number, articleId: number): Promise<void> {
    await prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      update: {},
      create: { userId, articleId },
    });
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, articleId: number): Promise<void> {
    await prisma.favorite.deleteMany({ where: { userId, articleId } });
  }

  /** @inheritdoc */
  favoritesCount(articleId: number): Promise<number> {
    return prisma.favorite.count({ where: { articleId } });
  }

  /** @inheritdoc */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const found = await prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });
    return found !== null;
  }
}
