import { Article, Prisma, PrismaClient, Tag, User } from '@prisma/client';
import { getPrismaClient } from './prisma.client';

export type ArticleWithAuthorAndTags = Article & {
  author: User;
  tags: Tag[];
  favorites: { userId: number }[];
  _count?: { favorites: number };
};

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  slug: string;
  authorId: number;
  tagList?: string[];
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
  slug?: string;
  tagList?: string[];
}

export interface ArticleFilterParams {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

const articleInclude = {
  author: true,
  tags: true,
  favorites: {
    select: { userId: true },
  },
} as const;

/**
 * Data access repository for Articles, tags connection, and favorites.
 */
export class ArticleRepository {
  private readonly prisma: PrismaClient;

  /**
   * Initializes ArticleRepository.
   *
   * @param {PrismaClient} [prisma] Optional PrismaClient instance
   */
  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma;
  }

  /**
   * Creates a new article with optional tag associations.
   */
  async create(data: CreateArticleData): Promise<ArticleWithAuthorAndTags> {
    const tagConnectOrCreate = data.tagList?.map((name) => ({
      where: { name },
      create: { name },
    })) ?? [];

    return this.prisma.article.create({
      data: {
        title: data.title,
        description: data.description,
        body: data.body,
        slug: data.slug,
        authorId: data.authorId,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: articleInclude,
    });
  }

  /**
   * Finds an article by slug.
   */
  async findBySlug(slug: string): Promise<ArticleWithAuthorAndTags | null> {
    return this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });
  }

  /**
   * Finds an article by ID.
   */
  async findById(id: number): Promise<ArticleWithAuthorAndTags | null> {
    return this.prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    });
  }

  /**
   * Updates an existing article.
   */
  async update(id: number, data: UpdateArticleData): Promise<ArticleWithAuthorAndTags> {
    const updatePayload: Prisma.ArticleUpdateInput = {
      title: data.title,
      description: data.description,
      body: data.body,
      slug: data.slug,
    };

    if (data.tagList !== undefined) {
      updatePayload.tags = {
        set: [],
        connectOrCreate: data.tagList.map((name) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    return this.prisma.article.update({
      where: { id },
      data: updatePayload,
      include: articleInclude,
    });
  }

  /**
   * Deletes an article by ID.
   */
  async delete(id: number): Promise<void> {
    await this.prisma.article.delete({
      where: { id },
    });
  }

  /**
   * Lists articles according to filter criteria and pagination.
   */
  async listArticles(params: ArticleFilterParams): Promise<{ articles: ArticleWithAuthorAndTags[]; total: number }> {
    const where: Prisma.ArticleWhereInput = {};

    if (params.tag) {
      where.tags = { some: { name: params.tag } };
    }
    if (params.author) {
      where.author = { username: params.author };
    }
    if (params.favorited) {
      where.favorites = { some: { user: { username: params.favorited } } };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { articles, total };
  }

  /**
   * Lists feed articles for followed authors.
   */
  async listFeed(
    userId: number,
    limit: number,
    offset: number
  ): Promise<{ articles: ArticleWithAuthorAndTags[]; total: number }> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followedBy: {
          some: { followerId: userId },
        },
      },
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { articles, total };
  }

  /**
   * Adds an article to a user's favorites idempotently.
   */
  async favorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.articleFavorite.upsert({
      where: {
        userId_articleId: { userId, articleId },
      },
      create: { userId, articleId },
      update: {},
    });
  }

  /**
   * Removes an article from a user's favorites idempotently.
   */
  async unfavorite(userId: number, articleId: number): Promise<void> {
    try {
      await this.prisma.articleFavorite.delete({
        where: {
          userId_articleId: { userId, articleId },
        },
      });
    } catch {
      // Idempotent
    }
  }
}
