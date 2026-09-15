import { Prisma, Article } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** Article with the relations needed to build API responses. */
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: true;
    favoritedBy: { select: { id: true } };
    _count: { select: { favoritedBy: true } };
  };
}>;

const ARTICLE_INCLUDE = {
  author: true,
  favoritedBy: { select: { id: true } },
  _count: { select: { favoritedBy: true } },
} as const;

/** Filters for listing articles. */
export interface ListArticlesFilter {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

/** Data required to persist a new article. */
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

/**
 * Data-access layer for Article entities and favorite relationships.
 */
export class ArticleRepository {
  /**
   * Lists articles matching optional tag/author/favorited filters.
   * @param filter the list filter and pagination
   * @returns the matching articles ordered by newest first
   */
  async list(filter: ListArticlesFilter): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: this.buildWhere(filter),
      include: ARTICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: filter.limit,
      skip: filter.offset,
    });
  }

  /**
   * Counts articles matching optional tag/author/favorited filters.
   * @param filter the list filter
   * @returns the total matching count
   */
  async count(filter: ListArticlesFilter): Promise<number> {
    return prisma.article.count({ where: this.buildWhere(filter) });
  }

  /**
   * Lists articles authored by users the given user follows.
   * @param userId the follower's id
   * @param limit page size
   * @param offset page offset
   * @returns the feed articles ordered by newest first
   */
  async feed(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: { author: { followedBy: { some: { followerId: userId } } } },
      include: ARTICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Counts articles in the given user's feed.
   * @param userId the follower's id
   * @returns the total feed count
   */
  async feedCount(userId: number): Promise<number> {
    return prisma.article.count({
      where: { author: { followedBy: { some: { followerId: userId } } } },
    });
  }

  /**
   * Finds a single article by slug.
   * @param slug the article slug
   * @returns the article with relations or null
   */
  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return prisma.article.findUnique({
      where: { slug },
      include: ARTICLE_INCLUDE,
    });
  }

  /**
   * Persists a new article.
   * @param data the article creation payload
   * @returns the created article with relations
   */
  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    return prisma.article.create({ data, include: ARTICLE_INCLUDE });
  }

  /**
   * Updates an article by id.
   * @param id the article id
   * @param data the fields to update
   * @returns the updated article with relations
   */
  async update(
    id: number,
    data: UpdateArticleData,
  ): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id },
      data,
      include: ARTICLE_INCLUDE,
    });
  }

  /**
   * Deletes an article by id.
   * @param id the article id
   */
  async delete(id: number): Promise<void> {
    await prisma.article.delete({ where: { id } });
  }

  /**
   * Adds a favorite relationship idempotently.
   * @param articleId the article id
   * @param userId the favoriting user id
   * @returns the updated article with relations
   */
  async favorite(
    articleId: number,
    userId: number,
  ): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id: articleId },
      data: { favoritedBy: { connect: { id: userId } } },
      include: ARTICLE_INCLUDE,
    });
  }

  /**
   * Removes a favorite relationship idempotently.
   * @param articleId the article id
   * @param userId the unfavoriting user id
   * @returns the updated article with relations
   */
  async unfavorite(
    articleId: number,
    userId: number,
  ): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id: articleId },
      data: { favoritedBy: { disconnect: { id: userId } } },
      include: ARTICLE_INCLUDE,
    });
  }

  /**
   * Collects the distinct set of tags across all articles.
   * @returns the sorted unique tag strings
   */
  async allTags(): Promise<string[]> {
    const articles = await prisma.article.findMany({
      select: { tagList: true },
    });
    const tags = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tagList) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }

  /**
   * Builds the Prisma where clause from list filters.
   * @param filter the list filter
   * @returns the Prisma where input
   */
  private buildWhere(filter: ListArticlesFilter): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};
    if (filter.tag) {
      where.tagList = { has: filter.tag };
    }
    if (filter.author) {
      where.author = { username: filter.author };
    }
    if (filter.favorited) {
      where.favoritedBy = { some: { username: filter.favorited } };
    }
    return where;
  }
}

export type { Article };
