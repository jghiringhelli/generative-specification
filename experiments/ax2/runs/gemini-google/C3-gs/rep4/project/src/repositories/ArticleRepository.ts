import slugify from 'slugify';
import { IArticleRepository, CreateArticleData, UpdateArticleData } from './IArticleRepository';
import { ArticleEntity, ArticleQueryFilters } from '../types';
import { prisma } from '../prisma';
import { NotFoundError } from '../errors/AppError';

export class ArticleRepository implements IArticleRepository {
  async findBySlug(slug: string, currentUserId?: string): Promise<ArticleEntity | null> {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });

    if (!article) return null;
    return this.mapToEntity(article, currentUserId);
  }

  async findMany(
    filters: ArticleQueryFilters,
    currentUserId?: string
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const limit = filters.limit !== undefined ? Number(filters.limit) : 20;
    const offset = filters.offset !== undefined ? Number(filters.offset) : 0;

    const where: any = {};

    if (filters.tag) {
      where.tags = {
        some: {
          name: filters.tag
        }
      };
    }

    if (filters.author) {
      where.author = {
        username: filters.author
      };
    }

    if (filters.favorited) {
      where.favorites = {
        some: {
          user: {
            username: filters.favorited
          }
        }
      };
    }

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true,
          favorites: true
        }
      }),
      prisma.article.count({ where })
    ]);

    const mapped = articles.map((a) => this.mapToEntity(a, currentUserId));
    return { articles: mapped, articlesCount };
  }

  async findFeed(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followedAuthorIds = follows.map((f) => f.followingId);
    if (followedAuthorIds.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    const where = {
      authorId: {
        in: followedAuthorIds
      }
    };

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true,
          favorites: true
        }
      }),
      prisma.article.count({ where })
    ]);

    const mapped = articles.map((a) => this.mapToEntity(a, userId));
    return { articles: mapped, articlesCount };
  }

  async create(authorId: string, data: CreateArticleData): Promise<ArticleEntity> {
    let baseSlug = slugify(data.title, { lower: true, strict: true });
    if (!baseSlug) {
      baseSlug = `article-${Date.now()}`;
    }

    let slug = baseSlug;
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const tagList = data.tagList ? Array.from(new Set(data.tagList.map((t) => t.trim()).filter(Boolean))) : [];

    const created = await prisma.article.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId,
        tags: {
          connectOrCreate: tagList.map((tag) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });

    return this.mapToEntity(created, authorId);
  }

  async update(slug: string, data: UpdateArticleData): Promise<ArticleEntity> {
    const existing = await prisma.article.findUnique({
      where: { slug }
    });
    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    let updatedSlug = existing.slug;
    if (data.title && data.title !== existing.title) {
      const baseSlug = slugify(data.title, { lower: true, strict: true }) || `article-${Date.now()}`;
      updatedSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const updated = await prisma.article.update({
      where: { slug },
      data: {
        slug: updatedSlug,
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        body: data.body ?? existing.body
      },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });

    return this.mapToEntity(updated);
  }

  async delete(slug: string): Promise<void> {
    await prisma.article.delete({
      where: { slug }
    });
  }

  async favorite(articleId: string, userId: string): Promise<ArticleEntity> {
    await prisma.favorite.upsert({
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

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });

    if (!article) throw new NotFoundError('Article not found');
    return this.mapToEntity(article, userId);
  }

  async unfavorite(articleId: string, userId: string): Promise<ArticleEntity> {
    try {
      await prisma.favorite.delete({
        where: {
          userId_articleId: {
            userId,
            articleId
          }
        }
      });
    } catch {
      // Idempotent unfavorite
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: true,
        tags: true,
        favorites: true
      }
    });

    if (!article) throw new NotFoundError('Article not found');
    return this.mapToEntity(article, userId);
  }

  private mapToEntity(
    article: {
      id: string;
      slug: string;
      title: string;
      description: string;
      body: string;
      createdAt: Date;
      updatedAt: Date;
      authorId: string;
      author?: any;
      tags?: { id: string; name: string }[];
      favorites?: { userId: string; articleId: string }[];
    },
    currentUserId?: string
  ): ArticleEntity {
    const favorited = currentUserId && article.favorites
      ? article.favorites.some((f) => f.userId === currentUserId)
      : false;

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      authorId: article.authorId,
      author: article.author ? {
        id: article.author.id,
        email: article.author.email,
        username: article.author.username,
        passwordHash: article.author.passwordHash,
        bio: article.author.bio ?? '',
        image: article.author.image ?? '',
        createdAt: article.author.createdAt,
        updatedAt: article.author.updatedAt
      } : undefined,
      tags: article.tags ? article.tags.map((t) => t.name) : [],
      favoritesCount: article.favorites ? article.favorites.length : 0,
      favorited
    };
  }
}
