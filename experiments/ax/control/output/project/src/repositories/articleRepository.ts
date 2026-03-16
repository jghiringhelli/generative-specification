import { PrismaClient, Article, User } from '@prisma/client';

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: string;
  tagList: string[];
}

export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface ArticleWithRelations extends Article {
  author: User;
  tags: Array<{ name: string }>;
  favorites: Array<{ userId: string }>;
  _count: {
    favorites: number;
  };
}

export class ArticleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    const tagConnectOrCreate = data.tagList.map(tagName => ({
      where: { name: tagName },
      create: { name: tagName }
    }));

    return this.prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          connectOrCreate: tagConnectOrCreate
        }
      },
      include: {
        author: true,
        tags: { select: { name: true } },
        favorites: { select: { userId: true } },
        _count: { select: { favorites: true } }
      }
    }) as Promise<ArticleWithRelations>;
  }

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: { select: { name: true } },
        favorites: { select: { userId: true } },
        _count: { select: { favorites: true } }
      }
    }) as Promise<ArticleWithRelations | null>;
  }

  async findAll(
    filters: ArticleFilters,
    pagination: PaginationParams
  ): Promise<ArticleWithRelations[]> {
    const where: any = {};

    if (filters.tag) {
      where.tags = {
        some: { name: filters.tag }
      };
    }

    if (filters.author) {
      where.author = {
        username: filters.author
      };
    }

    if (filters.favorited) {
      where.favorites = {
        some: {
          user: { username: filters.favorited }
        }
      };
    }

    return this.prisma.article.findMany({
      where,
      include: {
        author: true,
        tags: { select: { name: true } },
        favorites: { select: { userId: true } },
        _count: { select: { favorites: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset
    }) as Promise<ArticleWithRelations[]>;
  }

  async countArticles(filters: ArticleFilters): Promise<number> {
    const where: any = {};

    if (filters.tag) {
      where.tags = {
        some: { name: filters.tag }
      };
    }

    if (filters.author) {
      where.author = {
        username: filters.author
      };
    }

    if (filters.favorited) {
      where.favorites = {
        some: {
          user: { username: filters.favorited }
        }
      };
    }

    return this.prisma.article.count({ where });
  }

  async findFeed(
    userId: string,
    pagination: PaginationParams
  ): Promise<ArticleWithRelations[]> {
    return this.prisma.article.findMany({
      where: {
        author: {
          followers: {
            some: { followerId: userId }
          }
        }
      },
      include: {
        author: true,
        tags: { select: { name: true } },
        favorites: { select: { userId: true } },
        _count: { select: { favorites: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset
    }) as Promise<ArticleWithRelations[]>;
  }

  async countFeedArticles(userId: string): Promise<number> {
    return this.prisma.article.count({
      where: {
        author: {
          followers: {
            some: { followerId: userId }
          }
        }
      }
    });
  }

  async update(
    slug: string,
    data: UpdateArticleData
  ): Promise<ArticleWithRelations> {
    return this.prisma.article.update({
      where: { slug },
      data,
      include: {
        author: true,
        tags: { select: { name: true } },
        favorites: { select: { userId: true } },
        _count: { select: { favorites: true } }
      }
    }) as Promise<ArticleWithRelations>;
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async favoriteArticle(userId: string, articleId: string): Promise<void> {
    await this.prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      },
      create: {
        userId,
        articleId
      },
      update: {}
    });
  }

  async unfavoriteArticle(userId: string, articleId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        articleId
      }
    });
  }
}
