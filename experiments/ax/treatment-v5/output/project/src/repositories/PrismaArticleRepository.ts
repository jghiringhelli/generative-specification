
/**
 * Prisma implementation of IArticleRepository.
 * Handles all article-related database operations.
 */

import { PrismaClient } from '@prisma/client';
import type {
  IArticleRepository,
  IArticleWithMeta,
  IArticleListItem,
  IListArticlesQuery
} from './IArticleRepository';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/AppError';

export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(slug: string, currentUserId: number | null): Promise<IArticleWithMeta | null> {
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
          : false,
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    if (!article) {
      return null;
    }

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((at) => at.tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: currentUserId
        ? Array.isArray(article.favoritedBy) && article.favoritedBy.length > 0
        : false,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: currentUserId
          ? Array.isArray(article.author.followedBy) && article.author.followedBy.length > 0
          : false
      }
    };
  }

  async list(
    query: IListArticlesQuery,
    currentUserId: number | null
  ): Promise<{ articles: IArticleListItem[]; articlesCount: number }> {
    const { tag, author, favorited, limit = 20, offset = 0 } = query;

    // Build where clause
    const where: any = {};

    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag }
        }
      };
    }

    if (author) {
      where.author = {
        username: author
      };
    }

    if (favorited) {
      where.favoritedBy = {
        some: {
          user: { username: favorited }
        }
      };
    }

    // Execute query
    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
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
            : false,
          _count: {
            select: { favoritedBy: true }
          }
        }
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map((article) => ({
        slug: article.slug,
        title: article.title,
        description: article.description,
        // Note: body field NOT included in list responses (RealWorld spec 2024-08-16)
        tagList: article.tags.map((at) => at.tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        favorited: currentUserId
          ? Array.isArray(article.favoritedBy) && article.favoritedBy.length > 0
          : false,
        favoritesCount: article._count.favoritedBy,
        author: {
          username: article.author.username,
          bio: article.author.bio,
          image: article.author.image,
          following: currentUserId
            ? Array.isArray(article.author.followedBy) && article.author.followedBy.length > 0
            : false
        }
      })),
      articlesCount
    };
  }

  async getFeed(
    currentUserId: number,
    limit = 20,
    offset = 0
  ): Promise<{ articles: IArticleListItem[]; articlesCount: number }> {
    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          author: {
            followedBy: {
              some: { followerId: currentUserId }
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: { where: { followerId: currentUserId }, select: { followerId: true } }
            }
          },
          tags: {
            include: { tag: true }
          },
          favoritedBy: { where: { userId: currentUserId }, select: { userId: true } },
          _count: {
            select: { favoritedBy: true }
          }
        }
      }),
      this.prisma.article.count({
        where: {
          author: {
            followedBy: {
              some: { followerId: currentUserId }
            }
          }
        }
      })
    ]);

    return {
      articles: articles.map((article) => ({
        slug: article.slug,
        title: article.title,
        description: article.description,
        // Note: body field NOT included in list responses (RealWorld spec 2024-08-16)
        tagList: article.tags.map((at) => at.tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        favorited: Array.isArray(article.favoritedBy) && article.favoritedBy.length > 0,
        favoritesCount: article._count.favoritedBy,
        author: {
          username: article.author.username,
          bio: article.author.bio,
          image: article.author.image,
          following: Array.isArray(article.author.followedBy) && article.author.followedBy.length > 0
        }
      })),
      articlesCount
    };
  }

  async create(
    data: {
      slug: string;
      title: string;
      description: string;
      body: string;
      tagList: string[];
    },
    authorId: number
  ): Promise<IArticleWithMeta> {
    try {
      // Create article with tags
      const article = await this.prisma.article.create({
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          body: data.body,
          authorId,
          tags: {
            create: data.tagList.map((tagName) => ({
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
              image: true
            }
          },
          tags: {
            include: { tag: true }
          }
        }
      });

      return {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tags.map((at) => at.tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        favorited: false,
        favoritesCount: 0,
        author: {
          username: article.author.username,
          bio: article.author.bio,
          image: article.author.image,
          following: false
        }
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('Article slug already exists');
      }
      throw error;
    }
  }

  async update(
    slug: string,
    data: {
      title?: string;
      description?: string;
      body?: string;
    },
    currentUserId: number
  ): Promise<IArticleWithMeta> {
    // Find article
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, authorId: true }
    });

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    // Check authorization
    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can update this article');
    }

    // Update article
    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        title: data.title,
        description: data.description,
        body: data.body
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: { where: { followerId: currentUserId }, select: { followerId: true } }
          }
        },
        tags: {
          include: { tag: true }
        },
        favoritedBy: { where: { userId: currentUserId }, select: { userId: true } },
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    return {
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      body: updated.body,
      tagList: updated.tags.map((at) => at.tag.name),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      favorited: Array.isArray(updated.favoritedBy) && updated.favoritedBy.length > 0,
      favoritesCount: updated._count.favoritedBy,
      author: {
        username: updated.author.username,
        bio: updated.author.bio,
        image: updated.author.image,
        following: Array.isArray(updated.author.followedBy) && updated.author.followedBy.length > 0
      }
    };
  }

  async delete(slug: string, currentUserId: number): Promise<void> {
    // Find article
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, authorId: true }
    });

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    // Check authorization
    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this article');
    }

    // Delete article (cascade deletes tags, comments, favorites)
    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async favorite(slug: string, userId: number): Promise<IArticleWithMeta> {
    // Find article
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    // Create favorite (idempotent — ignore if already favorited)
    await this.prisma.userFavorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id
        }
      },
      update: {},
      create: {
        userId,
        articleId: article.id
      }
    });

    // Return updated article
    const result = await this.findBySlug(slug, userId);
    return result!; // Article exists (we just found it above)
  }

  async unfavorite(slug: string, userId: number): Promise<IArticleWithMeta> {
    // Find article
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    // Delete favorite (idempotent — ignore if not favorited)
    await this.prisma.userFavorite.deleteMany({
      where: {
        userId,
        articleId: article.id
      }
    });

    // Return updated article
    const result = await this.findBySlug(slug, userId);
    return result!; // Article exists (we just found it above)
  }

  async slugExists(slug: string): Promise<boolean> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    });
    return article !== null;
  }
}
