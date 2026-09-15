import { Prisma, PrismaClient } from '@prisma/client';
import {
  ArticleFilters,
  ArticleRecord,
  CreateArticleData,
  UpdateArticleData,
} from './article.types';

export interface ArticleRepositoryPort {
  list(filters: ArticleFilters, currentUserId?: number): Promise<[ReadonlyArray<ArticleRecord>, number]>;
  feed(userId: number, limit: number, offset: number): Promise<[ReadonlyArray<ArticleRecord>, number]>;
  findBySlug(slug: string, currentUserId?: number): Promise<ArticleRecord | null>;
  create(data: CreateArticleData): Promise<ArticleRecord>;
  update(id: number, data: UpdateArticleData, currentUserId: number): Promise<ArticleRecord>;
  delete(id: number): Promise<void>;
  favorite(userId: number, articleId: number): Promise<void>;
  unfavorite(userId: number, articleId: number): Promise<void>;
}

export class ArticleRepository implements ArticleRepositoryPort {
  public constructor(private readonly database: PrismaClient) {}

  public async list(filters: ArticleFilters, currentUserId?: number): Promise<[ReadonlyArray<ArticleRecord>, number]> {
    const where = this.buildFilters(filters);
    const [articles, count] = await this.database.$transaction([
      this.database.article.findMany({
        where,
        include: this.relations(currentUserId),
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.database.article.count({ where }),
    ]);
    return [articles as unknown as ArticleRecord[], count];
  }

  public async feed(userId: number, limit: number, offset: number): Promise<[ReadonlyArray<ArticleRecord>, number]> {
    const where: Prisma.ArticleWhereInput = {
      author: { followers: { some: { followerId: userId } } },
    };
    const [articles, count] = await this.database.$transaction([
      this.database.article.findMany({
        where, include: this.relations(userId), orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
      }),
      this.database.article.count({ where }),
    ]);
    return [articles as unknown as ArticleRecord[], count];
  }

  public async findBySlug(slug: string, currentUserId?: number): Promise<ArticleRecord | null> {
    const article = await this.database.article.findUnique({
      where: { slug }, include: this.relations(currentUserId),
    });
    return article as unknown as ArticleRecord | null;
  }

  public async create(data: CreateArticleData): Promise<ArticleRecord> {
    const article = await this.database.article.create({
      data: {
        slug: data.slug, title: data.title, description: data.description, body: data.body,
        authorId: data.authorId, tags: { create: this.tagConnections(data.tagList) },
      },
      include: this.relations(data.authorId),
    });
    return article as unknown as ArticleRecord;
  }

  public async update(id: number, data: UpdateArticleData, currentUserId: number): Promise<ArticleRecord> {
    const article = await this.database.article.update({
      where: { id },
      data: {
        slug: data.slug, title: data.title, description: data.description, body: data.body,
        tags: data.tagList ? { deleteMany: {}, create: this.tagConnections(data.tagList) } : undefined,
      },
      include: this.relations(currentUserId),
    });
    return article as unknown as ArticleRecord;
  }

  public async delete(id: number): Promise<void> {
    await this.database.article.delete({ where: { id } });
  }

  public async favorite(userId: number, articleId: number): Promise<void> {
    await this.database.favorite.upsert({
      where: { userId_articleId: { userId, articleId } }, create: { userId, articleId }, update: {},
    });
  }

  public async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.database.favorite.deleteMany({ where: { userId, articleId } });
  }

  private buildFilters(filters: ArticleFilters): Prisma.ArticleWhereInput {
    return {
      tags: filters.tag ? { some: { tag: { name: filters.tag } } } : undefined,
      author: filters.author ? { username: filters.author } : undefined,
      favorites: filters.favorited ? { some: { user: { username: filters.favorited } } } : undefined,
    };
  }

  private relations(currentUserId?: number) {
    return {
      author: { include: { followers: { where: { followerId: currentUserId ?? -1 } } } },
      tags: { include: { tag: true } },
      favorites: { where: { userId: currentUserId ?? -1 } },
      _count: { select: { favorites: true } },
    };
  }

  private tagConnections(tagList: ReadonlyArray<string>) {
    return [...new Set(tagList)].map((name) => ({
      tag: { connectOrCreate: { where: { name }, create: { name } } },
    }));
  }
}
