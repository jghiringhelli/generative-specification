import { PrismaClient, Article, Prisma } from '@prisma/client';
import { ArticleQueryFilters } from '../types/article.types';

/**
 * Article with all relations loaded.
 */
export type ArticleWithRelations = Article & {
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
  };
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  favoritedBy: Array<{
    userId: number;
  }>;
  _count: {
    favoritedBy: number;
  };
};

/**
 * Article repository interface.
 */
export interface IArticleRepository {
  findBySlug(slug: string): Promise<ArticleWithRelations | null>;
  findAll(filters: ArticleQueryFilters): Promise<ArticleWithRelations[]>;
  findFeed(userId: number, limit: number, offset: number): Promise<ArticleWithRelations[]>;
  create(data: {
    slug: string;
    title: string;
    description: string;
    body: string;
    authorId: number;
    tagIds: number[];
  }): Promise<ArticleWithRelations>;
  update(
    slug: string,
    data: { title?: string; description?: string; body?: string; newSlug?: string }
  ): Promise<ArticleWithRelations>;
  delete(slug: string): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
  favorite(userId: number, articleId: number): Promise<void>;
  unfavorite(userId: number, articleId: number): Promise<void>;
}

/**
 * Prisma implementation of article repository.
 */
export class ArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private readonly includeRelations = {
    author: {
      select: {
        id: true,
        username: true,
        bio: true,
        image: true
      }
    },
    tags: {
      include: {
        tag: {
          select: {
            name: true
          }
        }
      }
    },
    favoritedBy: {
      select: {
        userId: true
      }
    },
    _count: {
      select: {
        favoritedBy: true
      }
    }
  };

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({
      where: { slug },
      include: this.includeRelations
    });
  }

  async findAll(filters: ArticleQueryFilters): Promise<ArticleWithRelations[]> {
    const where: Prisma.ArticleWhereInput = {};

    if (filters.tag) {
      where.tags = {
        some: {
          tag: {
            name: filters.tag
          }
        }
      };
    }

    if (filters.author) {
      where.author = {
        username: filters.author
      };
    }

    if (filters.favorited) {
      where.favoritedBy = {
        some: {
          user: {
            username: filters.favorited
          }
        }
      };
    }

    return this.prisma.article.findMany({
      where,
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset
    });
  }

  async findFeed(
    userId: number,
    limit: number,
    offset: number
  ): Promise<ArticleWithRelations[]> {
    return this.prisma.article.findMany({
      where: {
        author: {
          followedBy: {
            some: {
              followerId: userId
            }
          }
        }
      },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async create(data: {
    slug: string;
    title: string;
    description: string;
    body: string;
    authorId: number;
    tagIds: number[];
  }): Promise<ArticleWithRelations> {
    return this.prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: data.tagIds.map((tagId) => ({
            tagId
          }))
        }
      },
      include: this.includeRelations
    });
  }

  async update(
    slug: string,
    data: { title?: string; description?: string; body?: string; newSlug?: string }
  ): Promise<ArticleWithRelations> {
    const updateData: Prisma.ArticleUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.newSlug !== undefined) updateData.slug = data.newSlug;

    return this.prisma.article.update({
      where: { slug },
      data: updateData,
      include: this.includeRelations
    });
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.article.count({
      where: { slug }
    });
    return count > 0;
  }

  async favorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.userFavorite.upsert({
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

  async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.userFavorite.deleteMany({
      where: {
        userId,
        articleId
      }
    });
  }
}
