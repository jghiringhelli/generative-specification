import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma.client';

export interface CreateArticleData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: number;
  readonly tagList?: readonly string[];
}

export interface UpdateArticleData {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly slug?: string;
  readonly tagList?: readonly string[];
}

export interface ArticleQueryFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
}

const articleIncludeClause = {
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true
    }
  },
  tags: {
    select: {
      name: true
    }
  },
  favorites: {
    select: {
      userId: true
    }
  },
  _count: {
    select: {
      favorites: true
    }
  }
} as const;

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleIncludeClause;
}>;

export interface IArticleRepository {
  create(data: CreateArticleData): Promise<ArticleWithRelations>;
  findBySlug(slug: string): Promise<ArticleWithRelations | null>;
  update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations>;
  delete(id: number): Promise<void>;
  listArticles(filters: ArticleQueryFilters): Promise<{ articles: ArticleWithRelations[]; totalCount: number }>;
  feedArticles(userId: number, limit: number, offset: number): Promise<{ articles: ArticleWithRelations[]; totalCount: number }>;
  favoriteArticle(userId: number, articleId: number): Promise<void>;
  unfavoriteArticle(userId: number, articleId: number): Promise<void>;
}

export class ArticleRepository implements IArticleRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  /**
   * Creates a new article along with linked tags.
   */
  public async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    const tagsConnect = data.tagList?.map((name) => ({
      where: { name },
      create: { name }
    })) || [];

    return this.db.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          connectOrCreate: tagsConnect
        }
      },
      include: articleIncludeClause
    });
  }

  /**
   * Finds an article by unique slug.
   */
  public async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.db.article.findUnique({
      where: { slug },
      include: articleIncludeClause
    });
  }

  /**
   * Updates an existing article and its tags.
   */
  public async update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations> {
    const updatePayload: Prisma.ArticleUpdateInput = {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.body ? { body: data.body } : {}),
      ...(data.slug ? { slug: data.slug } : {})
    };

    if (data.tagList !== undefined) {
      updatePayload.tags = {
        set: [],
        connectOrCreate: data.tagList.map((name) => ({
          where: { name },
          create: { name }
        }))
      };
    }

    return this.db.article.update({
      where: { id },
      data: updatePayload,
      include: articleIncludeClause
    });
  }

  /**
   * Deletes an article by primary key ID.
   */
  public async delete(id: number): Promise<void> {
    await this.db.article.delete({
      where: { id }
    });
  }

  /**
   * Lists articles according to filter criteria and pagination.
   */
  public async listArticles(
    filters: ArticleQueryFilters
  ): Promise<{ articles: ArticleWithRelations[]; totalCount: number }> {
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
        include: articleIncludeClause
      }),
      this.db.article.count({ where })
    ]);

    return { articles, totalCount };
  }

  /**
   * Lists articles by followed authors for the feed endpoint.
   */
  public async feedArticles(
    userId: number,
    limit: number,
    offset: number
  ): Promise<{ articles: ArticleWithRelations[]; totalCount: number }> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followedBy: {
          some: { followerId: userId }
        }
      }
    };

    const [articles, totalCount] = await Promise.all([
      this.db.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: articleIncludeClause
      }),
      this.db.article.count({ where })
    ]);

    return { articles, totalCount };
  }

  /**
   * Favorites an article idempotently.
   */
  public async favoriteArticle(userId: number, articleId: number): Promise<void> {
    await this.db.favorite.upsert({
      where: {
        userId_articleId: { userId, articleId }
      },
      create: { userId, articleId },
      update: {}
    });
  }

  /**
   * Unfavorites an article idempotently.
   */
  public async unfavoriteArticle(userId: number, articleId: number): Promise<void> {
    await this.db.favorite.deleteMany({
      where: { userId, articleId }
    });
  }
}
