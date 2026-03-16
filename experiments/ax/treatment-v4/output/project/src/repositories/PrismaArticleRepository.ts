import { PrismaClient } from '@prisma/client';
import {
  IArticleRepository,
  ArticleEntity,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilters,
  Pagination,
  ArticleListResult
} from './IArticleRepository';

/**
 * Prisma implementation of article repository.
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(slug: string, currentUserId?: number): Promise<ArticleEntity | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: currentUserId
              ? { where: { followerId: currentUserId }, select: { followerId: true } }
              : false
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: currentUserId
          ? { where: { userId: currentUserId }, select: { userId: true } }
          : { select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    if (!article) {
      return null;
    }

    return this.mapToArticleEntity(article, currentUserId);
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.article.count({
      where: { slug }
    });
    return count > 0;
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const article = await this.prisma.article.create({
      data: {
        title: data.title,
        description: data.description,
        body: data.body,
        slug: data.slug,
        authorId: data.authorId,
        tags: {
          create: data.tagList.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName }
              }
            }
          }))
        }
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: { where: { followerId: data.authorId }, select: { followerId: true } }
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: { select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    return this.mapToArticleEntity(article, data.authorId);
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, authorId: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        title: data.title,
        description: data.description,
        body: data.body,
        slug: data.slug
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: { where: { followerId: article.authorId }, select: { followerId: true } }
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: { where: { userId: article.authorId }, select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    return this.mapToArticleEntity(updated, article.authorId);
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async list(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number
  ): Promise<ArticleListResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

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

    if (filters.favoritedBy) {
      where.favoritedBy = {
        some: {
          user: {
            username: filters.favoritedBy
          }
        }
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: currentUserId
                ? { where: { followerId: currentUserId }, select: { followerId: true } }
                : false
            }
          },
          tags: {
            include: { tag: true }
          },
          favoritedBy: currentUserId
            ? { where: { userId: currentUserId }, select: { userId: true } }
            : { select: { userId: true } },
          _count: {
            select: { favoritedBy: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map(a => {
        const entity = this.mapToArticleEntity(a, currentUserId);
        // Remove body field for list responses per spec
        const { body, ...withoutBody } = entity;
        return withoutBody;
      }),
      articlesCount: total
    };
  }

  async getFeed(userId: number, pagination: Pagination): Promise<ArticleListResult> {
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          author: {
            followedBy: {
              some: {
                followerId: userId
              }
            }
          }
        },
        include: {
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: { where: { followerId: userId }, select: { followerId: true } }
            }
          },
          tags: {
            include: { tag: true }
          },
          favoritedBy: { where: { userId }, select: { userId: true } },
          _count: {
            select: { favoritedBy: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.article.count({
        where: {
          author: {
            followedBy: {
              some: {
                followerId: userId
              }
            }
          }
        }
      })
    ]);

    return {
      articles: articles.map(a => {
        const entity = this.mapToArticleEntity(a, userId);
        // Remove body field for feed responses per spec
        const { body, ...withoutBody } = entity;
        return withoutBody;
      }),
      articlesCount: total
    };
  }

  async favorite(slug: string, userId: number): Promise<ArticleEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    await this.prisma.userFavorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id
        }
      },
      create: {
        userId,
        articleId: article.id
      },
      update: {}
    });

    return (await this.findBySlug(slug, userId))!;
  }

  async unfavorite(slug: string, userId: number): Promise<ArticleEntity> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    await this.prisma.userFavorite.deleteMany({
      where: {
        userId,
        articleId: article.id
      }
    });

    return (await this.findBySlug(slug, userId))!;
  }

  /**
   * Map Prisma result to ArticleEntity.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToArticleEntity(article: any, currentUserId?: number): ArticleEntity {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: currentUserId
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (article.author.followedBy as any[]).length > 0
          : false
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tagList: article.tags.map((t: any) => t.tag.name),
      favorited: currentUserId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? article.favoritedBy.some((f: any) => f.userId === currentUserId)
        : false,
      favoritesCount: article._count.favoritedBy
    };
  }
}
