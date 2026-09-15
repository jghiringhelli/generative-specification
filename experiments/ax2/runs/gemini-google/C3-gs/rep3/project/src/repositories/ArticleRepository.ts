// src/repositories/ArticleRepository.ts
import { PrismaClient } from '@prisma/client';
import {
  IArticleRepository,
  ArticleRecord,
  CreateArticleData,
  UpdateArticleData,
  ListArticlesFilter
} from './IArticleRepository';
import { NotFoundError } from '../errors/AppError';

export class ArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapPrismaArticle(
    article: any,
    currentUserId?: string
  ): ArticleRecord {
    const favorited = currentUserId && article.favorites
      ? article.favorites.some((f: any) => f.userId === currentUserId)
      : false;

    const following = currentUserId && article.author && article.author.followedBy
      ? article.author.followedBy.some((f: any) => f.followerId === currentUserId)
      : false;

    const tagList = article.tags
      ? article.tags.map((at: any) => at.tag ? at.tag.name : at.tagId)
      : [];

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      authorId: article.authorId,
      author: {
        id: article.author.id,
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        ...( { following } as any )
      },
      favoritesCount: article._count ? article._count.favorites : (article.favorites ? article.favorites.length : 0),
      favorited
    };
  }

  public async create(data: CreateArticleData): Promise<ArticleRecord> {
    // Upsert tags and link them
    const article = await this.prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: data.tagList.map(name => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name }
              }
            }
          }))
        }
      },
      include: {
        author: true,
        tags: {
          include: {
            tag: true
          }
        },
        favorites: true,
        _count: {
          select: { favorites: true }
        }
      }
    });

    return this.mapPrismaArticle(article, data.authorId);
  }

  public async findBySlug(slug: string, currentUserId?: string): Promise<ArticleRecord | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          include: {
            followedBy: currentUserId ? { where: { followerId: currentUserId } } : false
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        favorites: currentUserId ? { where: { userId: currentUserId } } : true,
        _count: {
          select: { favorites: true }
        }
      }
    });

    if (!article) return null;
    return this.mapPrismaArticle(article, currentUserId);
  }

  public async update(
    slug: string,
    data: UpdateArticleData,
    currentUserId?: string
  ): Promise<ArticleRecord> {
    const existing = await this.findBySlug(slug, currentUserId);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const updateData: any = {};
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.body !== undefined) updateData.body = data.body;

    if (data.tagList !== undefined) {
      // replace tags
      await this.prisma.articleTag.deleteMany({
        where: { articleId: existing.id }
      });
      updateData.tags = {
        create: data.tagList.map(name => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name }
            }
          }
        }))
      };
    }

    const updated = await this.prisma.article.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        author: {
          include: {
            followedBy: currentUserId ? { where: { followerId: currentUserId } } : false
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        favorites: currentUserId ? { where: { userId: currentUserId } } : true,
        _count: {
          select: { favorites: true }
        }
      }
    });

    return this.mapPrismaArticle(updated, currentUserId);
  }

  public async delete(slug: string): Promise<void> {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }
    await this.prisma.article.delete({ where: { id: article.id } });
  }

  public async list(filter: ListArticlesFilter): Promise<{ articles: ArticleRecord[]; count: number }> {
    const where: any = {};

    if (filter.tag) {
      where.tags = {
        some: {
          tag: {
            name: filter.tag
          }
        }
      };
    }

    if (filter.author) {
      where.author = {
        username: filter.author
      };
    }

    if (filter.favorited) {
      where.favorites = {
        some: {
          user: {
            username: filter.favorited
          }
        }
      };
    }

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        where,
        take: filter.limit ?? 20,
        skip: filter.offset ?? 0,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              followedBy: filter.currentUserId ? { where: { followerId: filter.currentUserId } } : false
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          favorites: filter.currentUserId ? { where: { userId: filter.currentUserId } } : true,
          _count: {
            select: { favorites: true }
          }
        }
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map(a => this.mapPrismaArticle(a, filter.currentUserId)),
      count
    };
  }

  public async listFeed(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ articles: ArticleRecord[]; count: number }> {
    const where = {
      author: {
        followedBy: {
          some: {
            followerId: userId
          }
        }
      }
    };

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              followedBy: { where: { followerId: userId } }
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          favorites: { where: { userId } },
          _count: {
            select: { favorites: true }
          }
        }
      }),
      this.prisma.article.count({ where })
    ]);

    return {
      articles: articles.map(a => this.mapPrismaArticle(a, userId)),
      count
    };
  }

  public async favorite(userId: string, slug: string): Promise<ArticleRecord> {
    const article = await this.prisma.article.findUnique({
      where: { slug }
    });
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.prisma.favorite.upsert({
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

    const updated = await this.findBySlug(slug, userId);
    return updated!;
  }

  public async unfavorite(userId: string, slug: string): Promise<ArticleRecord> {
    const article = await this.prisma.article.findUnique({
      where: { slug }
    });
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        articleId: article.id
      }
    });

    const updated = await this.findBySlug(slug, userId);
    return updated!;
  }

  public async isFavorited(userId: string, articleId: string): Promise<boolean> {
    const fav = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    });
    return !!fav;
  }
}
