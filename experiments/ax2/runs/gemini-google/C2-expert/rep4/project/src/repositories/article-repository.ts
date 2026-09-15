import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../prisma';
import {
  IArticleRepository,
  ArticleRecord,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilterOptions,
  PaginationOptions,
  ArticleQueryResult,
} from './article-repository.interface';

const articleSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true,
    },
  },
  tags: {
    select: {
      name: true,
    },
  },
  _count: {
    select: {
      favorites: true,
    },
  },
} as const;

type PrismaArticleOutput = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;

function mapToArticleRecord(item: PrismaArticleOutput): ArticleRecord {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    body: item.body,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    authorId: item.authorId,
    author: item.author,
    tags: item.tags,
    favoritesCount: item._count.favorites,
  };
}

/**
 * Prisma implementation of the Article repository.
 */
export class ArticleRepository implements IArticleRepository {
  private readonly db: PrismaClient;

  /**
   * Constructs the ArticleRepository.
   *
   * @param {PrismaClient} [dbClient=defaultPrisma] - Injected Prisma client
   */
  constructor(dbClient: PrismaClient = defaultPrisma) {
    this.db = dbClient;
  }

  /**
   * Creates a new article.
   *
   * @param {CreateArticleData} data - Article creation parameters
   * @returns {Promise<ArticleRecord>} Created article record
   */
  public async create(data: CreateArticleData): Promise<ArticleRecord> {
    const created = await this.db.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: data.tagList && data.tagList.length > 0 ? {
          connectOrCreate: data.tagList.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        } : undefined,
      },
      select: articleSelect,
    });

    return mapToArticleRecord(created);
  }

  /**
   * Updates an existing article.
   *
   * @param {string} slug - Current article slug
   * @param {UpdateArticleData} data - Fields to update
   * @returns {Promise<ArticleRecord>} Updated article record
   */
  public async update(slug: string, data: UpdateArticleData): Promise<ArticleRecord> {
    const updateData: Prisma.ArticleUpdateInput = {
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.body !== undefined && { body: data.body }),
    };

    if (data.tagList !== undefined) {
      updateData.tags = {
        set: [],
        connectOrCreate: data.tagList.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      };
    }

    const updated = await this.db.article.update({
      where: { slug },
      data: updateData,
      select: articleSelect,
    });

    return mapToArticleRecord(updated);
  }

  /**
   * Deletes an article by slug.
   *
   * @param {string} slug - Article slug
   * @returns {Promise<void>}
   */
  public async delete(slug: string): Promise<void> {
    await this.db.article.delete({
      where: { slug },
    });
  }

  /**
   * Finds an article by slug.
   *
   * @param {string} slug - Article slug
   * @returns {Promise<ArticleRecord | null>} Article record or null
   */
  public async findBySlug(slug: string): Promise<ArticleRecord | null> {
    const article = await this.db.article.findUnique({
      where: { slug },
      select: articleSelect,
    });

    return article ? mapToArticleRecord(article) : null;
  }

  /**
   * Queries articles matching filters with pagination.
   *
   * @param {ArticleFilterOptions} filters - Filtering options
   * @returns {Promise<ArticleQueryResult>} Articles and total count
   */
  public async findMany(filters: ArticleFilterOptions): Promise<ArticleQueryResult> {
    const where: Prisma.ArticleWhereInput = {};

    if (filters.tag) {
      where.tags = { some: { name: filters.tag } };
    }
    if (filters.author) {
      where.author = { username: filters.author };
    }
    if (filters.favorited) {
      where.favorites = { some: { user: { username: filters.favorited } } };
    }

    const [articles, totalCount] = await Promise.all([
      this.db.article.findMany({
        where,
        take: filters.limit,
        skip: filters.offset,
        orderBy: { createdAt: 'desc' },
        select: articleSelect,
      }),
      this.db.article.count({ where }),
    ]);

    return {
      articles: articles.map(mapToArticleRecord),
      totalCount,
    };
  }

  /**
   * Finds feed articles for followed authors.
   *
   * @param {string} followerId - Follower user ID
   * @param {PaginationOptions} pagination - Pagination parameters
   * @returns {Promise<ArticleQueryResult>} Articles and total count
   */
  public async findFeed(followerId: string, pagination: PaginationOptions): Promise<ArticleQueryResult> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followedBy: {
          some: { followerId },
        },
      },
    };

    const [articles, totalCount] = await Promise.all([
      this.db.article.findMany({
        where,
        take: pagination.limit,
        skip: pagination.offset,
        orderBy: { createdAt: 'desc' },
        select: articleSelect,
      }),
      this.db.article.count({ where }),
    ]);

    return {
      articles: articles.map(mapToArticleRecord),
      totalCount,
    };
  }

  /**
   * Favorites an article idempotently.
   *
   * @param {string} articleId - Article ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  public async favorite(articleId: string, userId: string): Promise<void> {
    await this.db.favorite.upsert({
      where: {
        userId_articleId: { userId, articleId },
      },
      create: { userId, articleId },
      update: {},
    });
  }

  /**
   * Unfavorites an article idempotently.
   *
   * @param {string} articleId - Article ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  public async unfavorite(articleId: string, userId: string): Promise<void> {
    try {
      await this.db.favorite.delete({
        where: {
          userId_articleId: { userId, articleId },
        },
      });
    } catch {
      // Idempotent deletion
    }
  }

  /**
   * Checks if user has favorited an article.
   *
   * @param {string} articleId - Article ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if favorited
   */
  public async isFavorited(articleId: string, userId: string): Promise<boolean> {
    const record = await this.db.favorite.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    return record !== null;
  }
}
