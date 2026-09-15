import { PrismaClient } from '@prisma/client';
import {
  IArticleRepository,
  ArticleEntity,
  ArticleFilters,
  CreateArticleData,
  UpdateArticleData,
} from '../IArticleRepository';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';
import slugify from 'slugify';

export class PrismaArticleRepository implements IArticleRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private generateSlug(title: string): string {
    const base = slugify(title, { lower: true, strict: true }) || 'article';
    return `${base}-${Date.now().toString(36)}`;
  }

  private mapPrismaArticle(item: any, currentUserId?: string): ArticleEntity {
    const favorited = currentUserId
      ? (item.favorites || []).some((fav: any) => fav.userId === currentUserId)
      : false;
    const following = currentUserId
      ? (item.author.followedBy || []).some((f: any) => f.followerId === currentUserId)
      : false;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      body: item.body,
      tagList: (item.tags || []).map((t: any) => t.tag?.name || t.name),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      favorited,
      favoritesCount: item._count?.favorites ?? (item.favorites?.length || 0),
      author: {
        username: item.author.username,
        bio: item.author.bio,
        image: item.author.image,
        following,
      },
    };
  }

  async findBySlug(slug: string, currentUserId?: string): Promise<ArticleEntity | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          include: {
            followedBy: currentUserId ? { where: { followerId: currentUserId } } : false,
          },
        },
        tags: { include: { tag: true } },
        favorites: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: { select: { favorites: true } },
      },
    });

    if (!article) return null;
    return this.mapPrismaArticle(article, currentUserId);
  }

  async findAll(
    filters: ArticleFilters,
    currentUserId?: string
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const whereClause: any = {};

    if (filters.tag) {
      whereClause.tags = {
        some: {
          tag: {
            name: filters.tag,
          },
        },
      };
    }

    if (filters.author) {
      whereClause.author = {
        username: filters.author,
      };
    }

    if (filters.favorited) {
      whereClause.favorites = {
        some: {
          user: {
            username: filters.favorited,
          },
        },
      };
    }

    const [articles, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: filters.offset ?? 0,
        take: filters.limit ?? 20,
        include: {
          author: {
            include: {
              followedBy: currentUserId ? { where: { followerId: currentUserId } } : false,
            },
          },
          tags: { include: { tag: true } },
          favorites: currentUserId ? { where: { userId: currentUserId } } : false,
          _count: { select: { favorites: true } },
        },
      }),
      this.prisma.article.count({ where: whereClause }),
    ]);

    return {
      articles: articles.map((a) => this.mapPrismaArticle(a, currentUserId)),
      articlesCount: totalCount,
    };
  }

  async findFeed(
    currentUserId: string,
    pagination: { limit?: number; offset?: number }
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const whereClause = {
      author: {
        followedBy: {
          some: {
            followerId: currentUserId,
          },
        },
      },
    };

    const [articles, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: pagination.offset ?? 0,
        take: pagination.limit ?? 20,
        include: {
          author: {
            include: {
              followedBy: { where: { followerId: currentUserId } },
            },
          },
          tags: { include: { tag: true } },
          favorites: { where: { userId: currentUserId } },
          _count: { select: { favorites: true } },
        },
      }),
      this.prisma.article.count({ where: whereClause }),
    ]);

    return {
      articles: articles.map((a) => this.mapPrismaArticle(a, currentUserId)),
      articlesCount: totalCount,
    };
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const slug = this.generateSlug(data.title);

    // Ensure tags exist
    const tagConnectOrCreate = (data.tagList || []).map((name) => ({
      where: { name },
      create: { name },
    }));

    const article = await this.prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: tagConnectOrCreate.map((tc) => ({
            tag: {
              connectOrCreate: tc,
            },
          })),
        },
      },
      include: {
        author: true,
        tags: { include: { tag: true } },
        _count: { select: { favorites: true } },
      },
    });

    return this.mapPrismaArticle(article, data.authorId);
  }

  async update(slug: string, data: UpdateArticleData, currentUserId?: string): Promise<ArticleEntity> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    if (currentUserId && existing.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can update this article');
    }

    const newSlug = data.title && data.title !== existing.title ? this.generateSlug(data.title) : undefined;

    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        slug: newSlug,
        title: data.title,
        description: data.description,
        body: data.body,
      },
      include: {
        author: {
          include: {
            followedBy: currentUserId ? { where: { followerId: currentUserId } } : false,
          },
        },
        tags: { include: { tag: true } },
        favorites: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: { select: { favorites: true } },
      },
    });

    return this.mapPrismaArticle(updated, currentUserId);
  }

  async delete(slug: string, currentUserId: string): Promise<void> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    if (existing.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this article');
    }

    await this.prisma.article.delete({
      where: { slug },
    });
  }

  async favorite(slug: string, userId: string): Promise<ArticleEntity> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    await this.prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: existing.id,
        },
      },
      update: {},
      create: {
        userId,
        articleId: existing.id,
      },
    });

    return this.findBySlug(slug, userId) as Promise<ArticleEntity>;
  }

  async unfavorite(slug: string, userId: string): Promise<ArticleEntity> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        articleId: existing.id,
      },
    });

    return this.findBySlug(slug, userId) as Promise<ArticleEntity>;
  }
}
