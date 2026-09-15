import { Article, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

/** An article joined with its author and favorite relationships. */
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: true;
    favoritedBy: { select: { id: true } };
    _count: { select: { favoritedBy: true } };
  };
}>;

/** Filters accepted by the article list query. */
export interface ListFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

/** Data required to create an article. */
export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: number;
}

/** Fields that may be updated on an article. */
export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

const includeRelations = {
  author: true,
  favoritedBy: { select: { id: true } },
  _count: { select: { favoritedBy: true } },
} as const;

/**
 * Data-access layer for Article records.
 */
export class ArticleRepository {
  /**
   * List articles matching the given filters.
   * @param filters Tag/author/favorited filters and pagination.
   * @returns Matching articles with relations.
   */
  async list(filters: ListFilters): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: this.buildWhere(filters),
      include: includeRelations,
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    });
  }

  /**
   * Count articles matching the given filters.
   * @param filters Tag/author/favorited filters.
   * @returns The total number of matching articles.
   */
  async count(filters: ListFilters): Promise<number> {
    return prisma.article.count({ where: this.buildWhere(filters) });
  }

  /**
   * List articles authored by users the given user follows.
   * @param userId The follower id.
   * @param limit Pagination limit.
   * @param offset Pagination offset.
   * @returns The feed articles with relations.
   */
  async feed(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: { author: { followedBy: { some: { id: userId } } } },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Count articles in a user's feed.
   * @param userId The follower id.
   * @returns The total number of feed articles.
   */
  async feedCount(userId: number): Promise<number> {
    return prisma.article.count({
      where: { author: { followedBy: { some: { id: userId } } } },
    });
  }

  /**
   * Find an article by slug.
   * @param slug The article slug.
   * @returns The article with relations, or null.
   */
  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return prisma.article.findUnique({
      where: { slug },
      include: includeRelations,
    });
  }

  /**
   * Create an article.
   * @param data The creation payload.
   * @returns The created article with relations.
   */
  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    return prisma.article.create({
      data,
      include: includeRelations,
    });
  }

  /**
   * Update an article by id.
   * @param id The article id.
   * @param data The fields to update.
   * @returns The updated article with relations.
   */
  async update(
    id: number,
    data: UpdateArticleData,
  ): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id },
      data,
      include: includeRelations,
    });
  }

  /**
   * Delete an article by id.
   * @param id The article id.
   */
  async delete(id: number): Promise<void> {
    await prisma.article.delete({ where: { id } });
  }

  /**
   * Favorite an article (idempotent).
   * @param articleId The article id.
   * @param userId The user id.
   * @returns The article with relations.
   */
  async favorite(
    articleId: number,
    userId: number,
  ): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id: articleId },
      data: { favoritedBy: { connect: { id: userId } } },
      include: includeRelations,
    });
  }

  /**
   * Unfavorite an article (idempotent).
   * @param articleId The article id.
   * @param userId The user id.
   * @returns The article with relations.
   */
  async unfavorite(
    articleId: number,
    userId: number,
  ): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id: articleId },
      data: { favoritedBy: { disconnect: { id: userId } } },
      include: includeRelations,
    });
  }

  /**
   * Collect all distinct tags across every article.
   * @returns A de-duplicated list of tag strings.
   */
  async allTags(): Promise<string[]> {
    const articles = await prisma.article.findMany({
      select: { tagList: true },
    });
    const tags = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tagList) tags.add(tag);
    }
    return Array.from(tags);
  }

  /**
   * Build the Prisma where clause for list filters.
   * @param filters The list filters.
   * @returns A Prisma where input.
   */
  private buildWhere(filters: ListFilters): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};
    if (filters.tag) where.tagList = { has: filters.tag };
    if (filters.author) where.author = { username: filters.author };
    if (filters.favorited) {
      where.favoritedBy = { some: { username: filters.favorited } };
    }
    return where;
  }
}

export type { Article };
