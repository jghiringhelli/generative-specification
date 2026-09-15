import { Article, Prisma, PrismaClient } from '@prisma/client';
import {
  ArticleQuery,
  ArticleRecord,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from './IArticleRepository';

function toRecord(article: Article): ArticleRecord {
  return article;
}

function filters(query: ArticleQuery): Prisma.ArticleWhereInput {
  return {
    tags: query.tag ? { some: { name: query.tag } } : undefined,
    author: query.author ? { username: query.author } : undefined,
    favorites: query.favoritedBy
      ? { some: { user: { username: query.favoritedBy } } }
      : undefined,
  };
}

export class PrismaArticleRepository implements IArticleRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Persists an article and its tags. */
  public async create(data: CreateArticleData): Promise<ArticleRecord> {
    return toRecord(await this.client.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          connectOrCreate: data.tagList.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
    }));
  }

  public async findBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.client.article.findUnique({ where: { slug } });
  }

  public async list(query: ArticleQuery): Promise<ReadonlyArray<ArticleRecord>> {
    return this.client.article.findMany({
      where: filters(query),
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    });
  }

  public async count(query: ArticleQuery): Promise<number> {
    return this.client.article.count({ where: filters(query) });
  }

  public async listFeed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ReadonlyArray<ArticleRecord>> {
    return this.client.article.findMany({
      where: { author: { followers: { some: { followerId: userId } } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  public async countFeed(userId: string): Promise<number> {
    return this.client.article.count({
      where: { author: { followers: { some: { followerId: userId } } } },
    });
  }

  public async update(id: string, data: UpdateArticleData): Promise<ArticleRecord> {
    return toRecord(await this.client.article.update({ where: { id }, data }));
  }

  public async delete(id: string): Promise<void> {
    await this.client.article.delete({ where: { id } });
  }

  public async favorite(articleId: string, userId: string): Promise<void> {
    await this.client.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
  }

  public async unfavorite(articleId: string, userId: string): Promise<void> {
    await this.client.favorite.deleteMany({ where: { articleId, userId } });
  }

  public async isFavorited(articleId: string, userId: string): Promise<boolean> {
    return (await this.client.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })) !== null;
  }

  public async countFavorites(articleId: string): Promise<number> {
    return this.client.favorite.count({ where: { articleId } });
  }

  public async getTags(articleId: string): Promise<ReadonlyArray<string>> {
    const article = await this.client.article.findUnique({
      where: { id: articleId },
      select: { tags: { select: { name: true }, orderBy: { name: 'asc' } } },
    });
    return article?.tags.map((tag) => tag.name) ?? [];
  }
}
