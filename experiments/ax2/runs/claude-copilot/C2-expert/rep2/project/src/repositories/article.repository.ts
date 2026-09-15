import { Article, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ArticleWithRelations extends Article {
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
  };
  favorites: { userId: number }[];
  _count: { favorites: number };
}

export interface ArticleListFilters {
  tag?: string;
  author?: string;
  favoritedBy?: string;
  authorIds?: number[];
  limit: number;
  offset: number;
}

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: number;
}

export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

const articleInclude = {
  author: { select: { id: true, username: true, bio: true, image: true } },
  favorites: { select: { userId: true } },
  _count: { select: { favorites: true } }
} satisfies Prisma.ArticleInclude;

/**
 * Data-access adapter for the Article aggregate and favorites.
 */
export class ArticleRepository {
  /** Builds the shared where clause from list filters. */
  private buildWhere(filters: ArticleListFilters): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};
    if (filters.tag) {
      where.tagList = { has: filters.tag };
    }
    if (filters.author) {
      where.author = { username: filters.author };
    }
    if (filters.favoritedBy) {
      where.favorites = { some: { user: { username: filters.favoritedBy } } };
    }
    if (filters.authorIds) {
      where.authorId = { in: filters.authorIds };
    }
    return where;
  }

  /** Lists articles matching filters, newest first. */
  async list(filters: ArticleListFilters): Promise<ArticleWithRelations[]> {
    return prisma.article.findMany({
      where: this.buildWhere(filters),
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset
    }) as Promise<ArticleWithRelations[]>;
  }

  /** Counts articles matching filters. */
  async count(filters: ArticleListFilters): Promise<number> {
    return prisma.article.count({ where: this.buildWhere(filters) });
  }

  /** Finds an article by slug with relations. */
  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return prisma.article.findUnique({
      where: { slug },
      include: articleInclude
    }) as Promise<ArticleWithRelations | null>;
  }

  /** Persists a new article. */
  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    return prisma.article.create({
      data,
      include: articleInclude
    }) as Promise<ArticleWithRelations>;
  }

  /** Updates an existing article by id. */
  async update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations> {
    return prisma.article.update({
      where: { id },
      data,
      include: articleInclude
    }) as Promise<ArticleWithRelations>;
  }

  /** Deletes an article by id. */
  async delete(id: number): Promise<void> {
    await prisma.article.delete({ where: { id } });
  }

  /** Idempotently favorites an article. */
  async favorite(userId: number, articleId: number): Promise<void> {
    await prisma.articleFavorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {}
    });
  }

  /** Idempotently unfavorites an article. */
  async unfavorite(userId: number, articleId: number): Promise<void> {
    await prisma.articleFavorite.deleteMany({ where: { userId, articleId } });
  }

  /** Returns all distinct tags across every article. */
  async allTags(): Promise<string[]> {
    const rows = await prisma.article.findMany({ select: { tagList: true } });
    const unique = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tagList) {
        unique.add(tag);
      }
    }
    return Array.from(unique);
  }
}
