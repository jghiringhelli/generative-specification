import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

/** Article record joined with its author, tags, favorites and counts. */
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: true;
    favorites: true;
    _count: { select: { favorites: true } };
  };
}>;

/** Data required to create an article. */
export interface CreateArticleData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: string[];
  readonly authorId: number;
}

/** Fields that can be updated on an article. */
export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

/** Filters for listing articles. */
export interface ListArticlesFilter {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly authorIds?: number[];
  readonly limit: number;
  readonly offset: number;
}

const ARTICLE_INCLUDE = {
  author: true,
  favorites: true,
  _count: { select: { favorites: true } }
} as const;

/**
 * Persistence adapter for {@link Article} entities and their relationships.
 */
export class ArticleRepository {
  private readonly client = prisma;

  /**
   * Creates a new article.
   * @param data The article creation data.
   * @returns The created article with relations.
   */
  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    return this.client.article.create({
      data,
      include: ARTICLE_INCLUDE
    });
  }

  /**
   * Finds an article by its slug.
   * @param slug The article slug.
   * @returns The article with relations or `null`.
   */
  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.client.article.findUnique({
      where: { slug },
      include: ARTICLE_INCLUDE
    });
  }

  /**
   * Updates an article by id.
   * @param id The article id.
   * @param data The fields to update.
   * @returns The updated article with relations.
   */
  async update(
    id: number,
    data: UpdateArticleData
  ): Promise<ArticleWithRelations> {
    return this.client.article.update({
      where: { id },
      data,
      include: ARTICLE_INCLUDE
    });
  }

  /**
   * Deletes an article by id.
   * @param id The article id.
   */
  async delete(id: number): Promise<void> {
    await this.client.article.delete({ where: { id } });
  }

  /**
   * Lists articles matching the given filters, ordered newest first.
   * @param filter The list filter and pagination window.
   * @returns The matching articles and the total count (before pagination).
   */
  async list(
    filter: ListArticlesFilter
  ): Promise<{ articles: ArticleWithRelations[]; count: number }> {
    const where = this.buildWhere(filter);
    const [articles, count] = await Promise.all([
      this.client.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: filter.limit,
        skip: filter.offset
      }),
      this.client.article.count({ where })
    ]);
    return { articles, count };
  }

  private buildWhere(
    filter: ListArticlesFilter
  ): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};
    if (filter.tag) {
      where.tagList = { has: filter.tag };
    }
    if (filter.author) {
      where.author = { username: filter.author };
    }
    if (filter.favorited) {
      where.favorites = { some: { user: { username: filter.favorited } } };
    }
    if (filter.authorIds) {
      where.authorId = { in: filter.authorIds };
    }
    return where;
  }

  /**
   * Returns the distinct set of tags across all articles.
   * @returns A sorted list of unique tag strings.
   */
  async findAllTags(): Promise<string[]> {
    const rows = await this.client.article.findMany({
      select: { tagList: true }
    });
    const tags = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tagList) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }
}
