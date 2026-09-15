import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import {
  ArticleEntity,
  ArticleFeedOptions,
  ArticleQueryOptions,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from './IArticleRepository';
import { prisma as defaultPrisma } from '../config/prisma';

export class ArticleRepository implements IArticleRepository {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = defaultPrisma) {
    this.db = db;
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }

  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    const article = await this.db.article.findUnique({
      where: { slug },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!article) return null;

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((t) => t.tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      authorId: article.authorId,
    };
  }

  async list(
    options: ArticleQueryOptions
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const where: any = {};

    if (options.tag) {
      where.tags = {
        some: {
          tag: {
            name: options.tag,
          },
        },
      };
    }

    if (options.author) {
      where.author = {
        username: options.author,
      };
    }

    if (options.favorited) {
      where.favorites = {
        some: {
          user: {
            username: options.favorited,
          },
        },
      };
    }

    const [articles, articlesCount] = await Promise.all([
      this.db.article.findMany({
        where,
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
      this.db.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tags.map((t) => t.tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        authorId: article.authorId,
      })),
      articlesCount,
    };
  }

  async listFeed(
    userId: string,
    options: ArticleFeedOptions
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const where = {
      author: {
        followedBy: {
          some: {
            followerId: userId,
          },
        },
      },
    };

    const [articles, articlesCount] = await Promise.all([
      this.db.article.findMany({
        where,
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
      this.db.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tags.map((t) => t.tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        authorId: article.authorId,
      })),
      articlesCount,
    };
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const slug = this.generateSlug(data.title);

    const article = await this.db.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          slug,
          title: data.title,
          description: data.description,
          body: data.body,
          authorId: data.authorId,
        },
      });

      if (data.tagList && data.tagList.length > 0) {
        for (const tagName of data.tagList) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {},
          });
          await tx.articleTag.create({
            data: {
              articleId: created.id,
              tagId: tag.id,
            },
          });
        }
      }

      return created;
    });

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: data.tagList ?? [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      authorId: article.authorId,
    };
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const updateData: any = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = this.generateSlug(data.title);
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.body !== undefined) {
      updateData.body = data.body;
    }

    const updated = await this.db.article.update({
      where: { slug },
      data: updateData,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      body: updated.body,
      tagList: updated.tags.map((t) => t.tag.name),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      authorId: updated.authorId,
    };
  }

  async delete(slug: string): Promise<void> {
    await this.db.article.delete({
      where: { slug },
    });
  }

  async favorite(articleId: string, userId: string): Promise<void> {
    await this.db.favorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      create: {
        userId,
        articleId,
      },
      update: {},
    });
  }

  async unfavorite(articleId: string, userId: string): Promise<void> {
    await this.db.favorite.deleteMany({
      where: {
        userId,
        articleId,
      },
    });
  }

  async isFavorited(articleId: string, userId: string): Promise<boolean> {
    const count = await this.db.favorite.count({
      where: {
        userId,
        articleId,
      },
    });
    return count > 0;
  }

  async getFavoritesCount(articleId: string): Promise<number> {
    return this.db.favorite.count({
      where: { articleId },
    });
  }
}
