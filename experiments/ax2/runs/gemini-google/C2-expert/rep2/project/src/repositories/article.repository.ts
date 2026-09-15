import { prisma } from '../lib/prisma';
import { Article, User, Tag, Favorite } from '@prisma/client';

export type ArticleWithRelations = Article & {
  author: User & {
    followedBy?: { followerId: number }[];
  };
  tags: Tag[];
  favoritedBy: Favorite[];
  _count?: {
    favoritedBy: number;
  };
};

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList?: string[];
}

export interface UpdateArticleData {
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
}

export class ArticleRepository {
  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    const tagsConnect = data.tagList && data.tagList.length > 0
      ? {
          connectOrCreate: data.tagList.map((name) => ({
            where: { name },
            create: { name }
          }))
        }
      : undefined;

    return prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: tagsConnect
      },
      include: {
        author: true,
        tags: true,
        favoritedBy: true
      }
    });
  }

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true,
        favoritedBy: true
      }
    });
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleWithRelations> {
    const updateData: Record<string, unknown> = {};
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.body !== undefined) updateData.body = data.body;

    if (data.tagList !== undefined) {
      updateData.tags = {
        set: [],
        connectOrCreate: data.tagList.map((name) => ({
          where: { name },
          create: { name }
        }))
      };
    }

    return prisma.article.update({
      where: { slug },
      data: updateData,
      include: {
        author: true,
        tags: true,
        favoritedBy: true
      }
    });
  }

  async delete(slug: string): Promise<void> {
    await prisma.article.delete({
      where: { slug }
    });
  }

  async findMany(
    filters: ArticleFilters,
    limit: number,
    offset: number
  ): Promise<{ articles: ArticleWithRelations[]; totalCount: number }> {
    const where: Record<string, unknown> = {};

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
      where.favoritedBy = {
        some: {
          user: {
            username: filters.favorited
          }
        }
      };
    }

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true,
          favoritedBy: true
        }
      }),
      prisma.article.count({ where })
    ]);

    return { articles, totalCount };
  }

  async findFeed(
    userId: number,
    limit: number,
    offset: number
  ): Promise<{ articles: ArticleWithRelations[]; totalCount: number }> {
    const where = {
      author: {
        followedBy: {
          some: {
            followerId: userId
          }
        }
      }
    };

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true,
          favoritedBy: true
        }
      }),
      prisma.article.count({ where })
    ]);

    return { articles, totalCount };
  }

  async favorite(userId: number, articleId: number): Promise<void> {
    await prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      },
      update: {},
      create: {
        userId,
        articleId
      }
    });
  }

  async unfavorite(userId: number, articleId: number): Promise<void> {
    await prisma.favorite.deleteMany({
      where: {
        userId,
        articleId
      }
    });
  }
}

export const articleRepository = new ArticleRepository();
