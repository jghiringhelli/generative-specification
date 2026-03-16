import { PrismaClient, Article, Prisma } from '@prisma/client';
import {
  IArticleRepository,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilters,
} from './IArticleRepository';
import { generateSlug, makeSlugUnique } from '../utils/slug';

type ArticleWithRelations = Article & {
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
    followedBy: { followerId: number }[];
  };
  tags: {
    tag: {
      name: string;
    };
  }[];
  favoritedBy: {
    userId: number;
  }[];
};

export class ArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(slug: string, currentUserId?: number): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({
      where: { slug },
      include: this.getArticleIncludes(currentUserId),
    }) as Promise<ArticleWithRelations | null>;
  }

  async findById(id: number): Promise<Article | null> {
    return this.prisma.article.findUnique({
      where: { id },
    });
  }

  async findAll(
    filters: ArticleFilters,
    currentUserId?: number
  ): Promise<{ articles: ArticleWithRelations[]; count: number }> {
    const where: Prisma.ArticleWhereInput = {};

    if (filters.tag) {
      where.tags = {
        some: {
          tag: {
            name: filters.tag,
          },
        },
      };
    }

    if (filters.author) {
      where.author = {
        username: filters.author,
      };
    }

    if (filters.favorited) {
      where.favoritedBy = {
        some: {
          user: {
            username: filters.favorited,
          },
        },
      };
    }

    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: this.getArticleIncludes(currentUserId),
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }) as Promise<ArticleWithRelations[]>,
      this.prisma.article.count({ where }),
    ]);

    return { articles, count };
  }

  async findFeed(
    userId: number,
    limit: number,
    offset: number,
    currentUserId?: number
  ): Promise<{ articles: ArticleWithRelations[]; count: number }> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followedBy: {
          some: {
            followerId: userId,
          },
        },
      },
    };

    const [articles, count] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: this.getArticleIncludes(currentUserId),
        orderBy: {
          createdAt: 'desc',
        },
        take: Math.min(limit, 100),
        skip: offset,
      }) as Promise<ArticleWithRelations[]>,
      this.prisma.article.count({ where }),
    ]);

    return { articles, count };
  }

  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    const baseSlug = generateSlug(data.title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Upsert tags
    const tagIds: number[] = [];
    if (data.tagList && data.tagList.length > 0) {
      for (const tagName of data.tagList) {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {},
        });
        tagIds.push(tag.id);
      }
    }

    const article = await this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: this.getArticleIncludes(data.authorId),
    });

    return article as ArticleWithRelations;
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleWithRelations> {
    const updateData: Prisma.ArticleUpdateInput = {};

    if (data.title) {
      updateData.title = data.title;
      const newSlug = generateSlug(data.title);
      if (newSlug !== slug) {
        updateData.slug = await this.ensureUniqueSlug(newSlug);
      }
    }

    if (data.description) {
      updateData.description = data.description;
    }

    if (data.body) {
      updateData.body = data.body;
    }

    const article = await this.prisma.article.update({
      where: { slug },
      data: updateData,
      include: this.getArticleIncludes(),
    });

    return article as ArticleWithRelations;
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({
      where: { slug },
    });
  }

  async favorite(slug: string, userId: number): Promise<ArticleWithRelations> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Upsert to make it idempotent
    await this.prisma.userFavorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
      create: {
        userId,
        articleId: article.id,
      },
      update: {},
    });

    return this.findBySlug(slug, userId) as Promise<ArticleWithRelations>;
  }

  async unfavorite(slug: string, userId: number): Promise<ArticleWithRelations> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // deleteMany won't error if record doesn't exist (idempotent)
    await this.prisma.userFavorite.deleteMany({
      where: {
        userId,
        articleId: article.id,
      },
    });

    return this.findBySlug(slug, userId) as Promise<ArticleWithRelations>;
  }

  /**
   * Ensure slug is unique by appending random suffix if needed
   */
  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    const existing = await this.prisma.article.findUnique({
      where: { slug: baseSlug },
    });

    if (!existing) {
      return baseSlug;
    }

    return makeSlugUnique(baseSlug);
  }

  /**
   * Build Prisma include clause for article queries with author and tags
   */
  private getArticleIncludes(currentUserId?: number): Prisma.ArticleInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          bio: true,
          image: true,
          followedBy: currentUserId
            ? {
                where: {
                  followerId: currentUserId,
                },
                select: {
                  followerId: true,
                },
              }
            : false,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
      favoritedBy: {
        select: {
          userId: true,
        },
      },
    };
  }
}
