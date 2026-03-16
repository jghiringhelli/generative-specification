import { PrismaClient } from '@prisma/client';
import {
  IArticleRepository,
  ArticleWithRelations,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilters,
  Pagination,
  ArticleListResult
} from './IArticleRepository';

/**
 * Prisma implementation of IArticleRepository.
 * Single responsibility: translate Article domain operations to Prisma ORM calls.
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(slug: string, currentUserId?: number): Promise<ArticleWithRelations | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
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
            tag: true
          }
        },
        favoritedBy: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!article) {
      return null;
    }

    return this.mapToArticleWithRelations(article, currentUserId);
  }

  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    // Upsert tags and create article with relations in transaction
    const article = await this.prisma.$transaction(async (tx) => {
      // Upsert tags
      const tagRecords = await Promise.all(
        data.tags.map((tagName) =>
          tx.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {}
          })
        )
      );

      // Create article with tag relations
      return tx.article.create({
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          body: data.body,
          authorId: data.authorId,
          tags: {
            create: tagRecords.map((tag) => ({
              tagId: tag.id
            }))
          }
        },
        include: {
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
              tag: true
            }
          },
          favoritedBy: {
            select: {
              userId: true
            }
          }
        }
      });
    });

    return this.mapToArticleWithRelations(article, data.authorId);
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleWithRelations> {
    const article = await this.prisma.article.update({
      where: { slug },
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body
      },
      include: {
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
            tag: true
          }
        },
        favoritedBy: {
          select: {
            userId: true
          }
        }
      }
    });

    return this.mapToArticleWithRelations(article);
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async findMany(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number
  ): Promise<ArticleListResult> {
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

    if (filters.favorited) {
      where.favoritedBy = {
        some: {
          user: {
            username: filters.favorited
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
              id: true,
              username: true,
              bio: true,
              image: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          favoritedBy: {
            select: {
              userId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map((a) => this.mapToArticleWithRelations(a, currentUserId)),
      articlesCount: total
    };
  }

  async findFeed(userId: number, pagination: Pagination): Promise<ArticleListResult> {
    const where = {
      author: {
        followedBy: {
          some: {
            followerId: userId
          }
        }
      }
    };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
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
              tag: true
            }
          },
          favoritedBy: {
            select: {
              userId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map((a) => this.mapToArticleWithRelations(a, userId)),
      articlesCount: total
    };
  }

  async favorite(articleId: number, userId: number): Promise<void> {
    await this.prisma.userFavorite.create({
      data: {
        articleId,
        userId
      }
    });
  }

  async unfavorite(articleId: number, userId: number): Promise<void> {
    await this.prisma.userFavorite.delete({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    });
  }

  /**
   * Map Prisma article result to domain ArticleWithRelations.
   */
  private mapToArticleWithRelations(
    article: any,
    currentUserId?: number
  ): ArticleWithRelations {
    const favorited = currentUserId
      ? article.favoritedBy.some((f: any) => f.userId === currentUserId)
      : false;

    const following = false; // Will be enriched by service layer if needed

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      authorId: article.authorId,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      },
      tags: article.tags.map((at: any) => at.tag.name),
      favorited,
      favoritesCount: article.favoritedBy.length
    };
  }
}
