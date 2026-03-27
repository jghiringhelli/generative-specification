import { PrismaClient, Prisma } from '@prisma/client';
import type {
  Article,
  ArticleFilters,
  CreateArticleData,
  PaginatedArticles,
  Pagination,
  UpdateArticleData,
} from '../types/domain';
import type { IArticleRepository } from './IArticleRepository';
import { NotFoundError } from '../errors/AppError';
import { generateSlug } from '../utils/slugify';

/** Prisma error code for record-not-found on update/delete. */
const PRISMA_NOT_FOUND = 'P2025';

/**
 * Sentinel viewer ID used when no authenticated user is present.
 * User IDs start at 1, so -1 never matches any real user —
 * all viewer-relative queries (favorites, following) return empty results.
 */
const NO_VIEWER = -1;

/**
 * Shape of the Prisma article payload returned by all read queries.
 * Manually typed to avoid complex Prisma generic inference throughout the class.
 */
interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
    followers: { followerId: number }[];
  };
  tags: { tag: { name: string } }[];
  favorites: { userId: number }[];
  _count: { favorites: number };
}

/**
 * Build the Prisma include object for article queries.
 * All viewer-relative fields (favorited, author.following) are filtered by
 * the sentinel value NO_VIEWER when no authenticated user is present.
 *
 * @param viewerId - Authenticated user ID, or NO_VIEWER (-1) for anonymous
 */
function buildArticleInclude(viewerId: number) {
  return {
    author: {
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
        followers: {
          where: { followerId: viewerId },
          select: { followerId: true },
        },
      },
    },
    tags: {
      include: { tag: { select: { name: true } } },
      orderBy: { tag: { name: 'asc' as const } },
    },
    favorites: {
      where: { userId: viewerId },
      select: { userId: true },
    },
    _count: { select: { favorites: true } },
  };
}

/**
 * Map a raw Prisma article row to the domain `Article` entity.
 */
function mapToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    authorId: row.authorId,
    author: {
      username: row.author.username,
      bio: row.author.bio,
      image: row.author.image,
      following: row.author.followers.length > 0,
    },
    tagList: row.tags.map((t) => t.tag.name),
    favoritesCount: row._count.favorites,
    favorited: row.favorites.length > 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Build Prisma where input from optional article list filters.
 */
function buildWhereFromFilters(filters: ArticleFilters): Prisma.ArticleWhereInput {
  const where: Prisma.ArticleWhereInput = {};
  if (filters.tag) {
    where.tags = { some: { tag: { name: filters.tag } } };
  }
  if (filters.author) {
    where.author = { username: filters.author };
  }
  if (filters.favorited) {
    where.favorites = { some: { user: { username: filters.favorited } } };
  }
  return where;
}

/**
 * PostgreSQL-backed implementation of `IArticleRepository` via Prisma.
 *
 * All database I/O for article operations is confined to this adapter.
 * Domain services import `IArticleRepository` only — never this class directly.
 * Wire at the composition root (`src/server.ts`).
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findBySlug(slug: string, currentUserId?: number): Promise<Article | null> {
    const viewerId = currentUserId ?? NO_VIEWER;
    const row = await this.prisma.article.findUnique({
      where: { slug },
      include: buildArticleInclude(viewerId),
    });
    return row ? mapToArticle(row as unknown as ArticleRow) : null;
  }

  /** @inheritdoc */
  async findAll(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number,
  ): Promise<PaginatedArticles> {
    const viewerId = currentUserId ?? NO_VIEWER;
    const where = buildWhereFromFilters(filters);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { createdAt: 'desc' },
        include: buildArticleInclude(viewerId),
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: rows.map((r) => mapToArticle(r as unknown as ArticleRow)),
      articlesCount: total,
    };
  }

  /** @inheritdoc */
  async findFeed(userId: number, pagination: Pagination): Promise<PaginatedArticles> {
    const where: Prisma.ArticleWhereInput = {
      author: { followers: { some: { followerId: userId } } },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { createdAt: 'desc' },
        include: buildArticleInclude(userId),
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: rows.map((r) => mapToArticle(r as unknown as ArticleRow)),
      articlesCount: total,
    };
  }

  /** @inheritdoc */
  async create(authorId: number, data: CreateArticleData): Promise<Article> {
    const slug = generateSlug(data.title);
    const row = await this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId,
        tags: {
          create: data.tagList.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include: buildArticleInclude(NO_VIEWER),
    });
    return mapToArticle(row as unknown as ArticleRow);
  }

  /** @inheritdoc */
  async update(slug: string, data: UpdateArticleData): Promise<Article> {
    const newSlug = data.title !== undefined ? generateSlug(data.title) : undefined;
    try {
      const row = await this.prisma.article.update({
        where: { slug },
        data: {
          ...(data.title !== undefined && { title: data.title, slug: newSlug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.body !== undefined && { body: data.body }),
          ...(data.tagList !== undefined && {
            tags: {
              deleteMany: {},
              create: data.tagList.map((name) => ({
                tag: { connectOrCreate: { where: { name }, create: { name } } },
              })),
            },
          }),
        },
        include: buildArticleInclude(NO_VIEWER),
      });
      return mapToArticle(row as unknown as ArticleRow);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_NOT_FOUND) {
        throw new NotFoundError('article');
      }
      throw err;
    }
  }

  /** @inheritdoc */
  async delete(slug: string): Promise<void> {
    try {
      await this.prisma.article.delete({ where: { slug } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_NOT_FOUND) {
        throw new NotFoundError('article');
      }
      throw err;
    }
  }

  /** @inheritdoc */
  async addFavorite(userId: number, slug: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!article) throw new NotFoundError('article');

    await this.prisma.articleFavorite.upsert({
      where: { userId_articleId: { userId, articleId: article.id } },
      create: { userId, articleId: article.id },
      update: {},
    });

    const row = await this.prisma.article.findUnique({
      where: { slug },
      include: buildArticleInclude(userId),
    });
    return mapToArticle(row as unknown as ArticleRow);
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, slug: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!article) throw new NotFoundError('article');

    try {
      await this.prisma.articleFavorite.delete({
        where: { userId_articleId: { userId, articleId: article.id } },
      });
    } catch (err) {
      // Idempotent: ignore P2025 — favorite already absent, treat as success
      if (
        !(
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_NOT_FOUND
        )
      ) {
        throw err;
      }
    }

    const row = await this.prisma.article.findUnique({
      where: { slug },
      include: buildArticleInclude(userId),
    });
    return mapToArticle(row as unknown as ArticleRow);
  }
}
