import { Article, User, Tag } from '@prisma/client';
import { prisma } from '../../db/prisma';

export type ArticleWithRelations = Article & {
  author: User;
  tags: Tag[];
  favorites: { userId: string }[];
  _count?: {
    favorites: number;
  };
};

export interface CreateArticleDbData {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: string;
  tagList: string[];
}

export interface UpdateArticleDbData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

export interface IArticleRepository {
  create(data: CreateArticleDbData): Promise<ArticleWithRelations>;
  findBySlug(slug: string): Promise<ArticleWithRelations | null>;
  update(slug: string, data: UpdateArticleDbData): Promise<ArticleWithRelations>;
  delete(slug: string): Promise<void>;
  findMany(filters: ArticleFilters): Promise<ArticleWithRelations[]>;
  count(filters: Omit<ArticleFilters, 'limit' | 'offset'>): Promise<number>;
  findFeed(userId: string, limit: number, offset: number): Promise<ArticleWithRelations[]>;
  countFeed(userId: string): Promise<number>;
  favorite(userId: string, articleId: string): Promise<void>;
  unfavorite(userId: string, articleId: string): Promise<void>;
}

export class ArticleRepository implements IArticleRepository {
  async create(data: CreateArticleDbData): Promise<ArticleWithRelations> {
    const { slug, title, description, body, authorId, tagList } = data;

    return prisma.article.create({
      data: {
        slug,
        title,
        description,
        body,
        authorId,
        tags: {
          connectOrCreate: tagList.map((tag) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });
  }

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });
  }

  async update(slug: string, data: UpdateArticleDbData): Promise<ArticleWithRelations> {
    const { tagList, ...rest } = data;

    const updatePayload: any = { ...rest };

    if (tagList !== undefined) {
      updatePayload.tags = {
        set: [],
        connectOrCreate: tagList.map((tag) => ({
          where: { name: tag },
          create: { name: tag }
        }))
      };
    }

    return prisma.article.update({
      where: { slug },
      data: updatePayload,
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });
  }

  async delete(slug: string): Promise<void> {
    await prisma.article.delete({
      where: { slug }
    });
  }

  private buildWhereClause(filters: { tag?: string; author?: string; favorited?: string }): any {
    const where: any = {};

    if (filters.tag) {
      where.tags = {
        some: {
          name: filters.tag
        }
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
          user: {
            username: filters.favorited
          }
        }
      };
    }

    return where;
  }

  async findMany(filters: ArticleFilters): Promise<ArticleWithRelations[]> {
    const where = this.buildWhereClause(filters);

    return prisma.article.findMany({
      where,
      include: {
        author: true,
        tags: true,
        favorites: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: filters.limit,
      skip: filters.offset
    });
  }

  async count(filters: Omit<ArticleFilters, 'limit' | 'offset'>): Promise<number> {
    const where = this.buildWhereClause(filters);
    return prisma.article.count({ where });
  }

  async findFeed(userId: string, limit: number, offset: number): Promise<ArticleWithRelations[]> {
    const where = {
      author: {
        followedBy: {
          some: {
            followerId: userId
          }
        }
      }
    };

    return prisma.article.findMany({
      where,
      include: {
        author: true,
        tags: true,
        favorites: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  async countFeed(userId: string): Promise<number> {
    return prisma.article.count({
      where: {
        author: {
          followedBy: {
            some: {
              followerId: userId
            }
          }
        }
      }
    });
  }

  async favorite(userId: string, articleId: string): Promise<void> {
    await prisma.favorite.upsert({
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

  async unfavorite(userId: string, articleId: string): Promise<void> {
    await prisma.favorite.deleteMany({
      where: {
        userId,
        articleId
      }
    });
  }
}
