// src/repositories/ArticleRepository.ts
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { IArticleRepository, CreateArticleData, UpdateArticleData } from './IArticleRepository';
import { Article, ArticleListItem, ArticleFilterOptions } from '../types';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { prisma as defaultPrisma } from '../prisma';

export class ArticleRepository implements IArticleRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  private generateSlug(title: string): string {
    const base = slugify(title, { lower: true, strict: true, trim: true });
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${randomSuffix}`;
  }

  private async formatArticle(
    article: any,
    currentUserId?: string
  ): Promise<Article> {
    const favoritesCount = await this.prisma.favorite.count({
      where: { articleId: article.id }
    });

    let favorited = false;
    let following = false;

    if (currentUserId) {
      const fav = await this.prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: currentUserId,
            articleId: article.id
          }
        }
      });
      favorited = !!fav;

      const follow = await this.prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: article.author.id
          }
        }
      });
      following = !!follow;
    }

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags ? article.tags.map((t: any) => t.name) : [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited,
      favoritesCount,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  private async formatArticleListItem(
    article: any,
    currentUserId?: string
  ): Promise<ArticleListItem> {
    const favoritesCount = await this.prisma.favorite.count({
      where: { articleId: article.id }
    });

    let favorited = false;
    let following = false;

    if (currentUserId) {
      const fav = await this.prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: currentUserId,
            articleId: article.id
          }
        }
      });
      favorited = !!fav;

      const follow = await this.prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: article.author.id
          }
        }
      });
      following = !!follow;
    }

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags ? article.tags.map((t: any) => t.name) : [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited,
      favoritesCount,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  async create(authorId: string, data: CreateArticleData): Promise<Article> {
    const slug = this.generateSlug(data.title);

    const tagConnectOrCreate = (data.tagList || []).map(tagName => ({
      where: { name: tagName },
      create: { name: tagName }
    }));

    const article = await this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        author: { connect: { id: authorId } },
        tags: {
          connectOrCreate: tagConnectOrCreate
        }
      },
      include: {
        author: true,
        tags: true
      }
    });

    return this.formatArticle(article, authorId);
  }

  async findBySlug(slug: string, currentUserId?: string): Promise<Article | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true
      }
    });

    if (!article) {
      return null;
    }

    return this.formatArticle(article, currentUserId);
  }

  async update(slug: string, authorId: string, data: UpdateArticleData): Promise<Article> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
      include: { author: true }
    });

    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenError('You are not authorized to update this article');
    }

    let newSlug = existing.slug;
    if (data.title && data.title !== existing.title) {
      newSlug = this.generateSlug(data.title);
    }

    const tagConnectOrCreate = data.tagList
      ? data.tagList.map(tagName => ({
          where: { name: tagName },
          create: { name: tagName }
        }))
      : undefined;

    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        ...(data.title !== undefined && { title: data.title, slug: newSlug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.body !== undefined && { body: data.body }),
        ...(tagConnectOrCreate && {
          tags: {
            set: [],
            connectOrCreate: tagConnectOrCreate
          }
        })
      },
      include: {
        author: true,
        tags: true
      }
    });

    return this.formatArticle(updated, authorId);
  }

  async delete(slug: string, authorId: string): Promise<void> {
    const existing = await this.prisma.article.findUnique({
      where: { slug }
    });

    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenError('You are not authorized to delete this article');
    }

    await this.prisma.article.delete({
      where: { slug }
    });
  }

  async findMany(
    options: ArticleFilterOptions,
    currentUserId?: string
  ): Promise<{ articles: ArticleListItem[]; articlesCount: number }> {
    const limit = options.limit !== undefined ? Number(options.limit) : 20;
    const offset = options.offset !== undefined ? Number(options.offset) : 0;

    const where: any = {};

    if (options.tag) {
      where.tags = {
        some: {
          name: options.tag
        }
      };
    }

    if (options.author) {
      where.author = {
        username: options.author
      };
    }

    if (options.favorited) {
      where.favoritedBy = {
        some: {
          user: {
            username: options.favorited
          }
        }
      };
    }

    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true
        }
      }),
      this.prisma.article.count({ where })
    ]);

    const formattedArticles = await Promise.all(
      articles.map(article => this.formatArticleListItem(article, currentUserId))
    );

    return { articles: formattedArticles, articlesCount };
  }

  async findFeed(
    userId: string,
    options: { limit?: number; offset?: number }
  ): Promise<{ articles: ArticleListItem[]; articlesCount: number }> {
    const limit = options.limit !== undefined ? Number(options.limit) : 20;
    const offset = options.offset !== undefined ? Number(options.offset) : 0;

    const followedUsers = await this.prisma.follows.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = followedUsers.map(f => f.followingId);

    const where = {
      authorId: {
        in: followingIds
      }
    };

    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true
        }
      }),
      this.prisma.article.count({ where })
    ]);

    const formattedArticles = await Promise.all(
      articles.map(article => this.formatArticleListItem(article, userId))
    );

    return { articles: formattedArticles, articlesCount };
  }

  async favorite(userId: string, slug: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
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

    const refreshed = await this.prisma.article.findUnique({
      where: { id: article.id },
      include: {
        author: true,
        tags: true
      }
    });

    return this.formatArticle(refreshed, userId);
  }

  async unfavorite(userId: string, slug: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    try {
      await this.prisma.favorite.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id
          }
        }
      });
    } catch (_err) {
      // Ignore if not previously favorited
    }

    const refreshed = await this.prisma.article.findUnique({
      where: { id: article.id },
      include: {
        author: true,
        tags: true
      }
    });

    return this.formatArticle(refreshed, userId);
  }
}
