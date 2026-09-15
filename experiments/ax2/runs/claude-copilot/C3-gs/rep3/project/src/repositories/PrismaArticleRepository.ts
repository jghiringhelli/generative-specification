import { PrismaClient, Prisma } from '@prisma/client';
import { IArticleRepository, ArticleListResult } from './IArticleRepository';
import {
  Article,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput,
} from '../types/domain';

type ArticleWithTags = Prisma.ArticleGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

/** PrismaClient-backed implementation of {@link IArticleRepository}. */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private static readonly includeTags = {
    tags: { include: { tag: true } },
  } as const;

  private toDomain(record: ArticleWithTags): Article {
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      description: record.description,
      body: record.body,
      authorId: record.authorId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      tagList: record.tags.map((t) => t.tag.name).sort(),
    };
  }

  private async connectTags(names: string[]) {
    const unique = Array.from(new Set(names));
    return Promise.all(
      unique.map(async (name) => {
        const tag = await this.prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        return { tagId: tag.id };
      }),
    );
  }

  async create(input: CreateArticleInput): Promise<Article> {
    const tagConnections = await this.connectTags(input.tagList);
    const record = await this.prisma.article.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        body: input.body,
        authorId: input.authorId,
        tags: { create: tagConnections },
      },
      include: PrismaArticleRepository.includeTags,
    });
    return this.toDomain(record);
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const record = await this.prisma.article.findUnique({
      where: { slug },
      include: PrismaArticleRepository.includeTags,
    });
    return record ? this.toDomain(record) : null;
  }

  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    const where: Prisma.ArticleWhereInput = {};
    if (filter.tag) {
      where.tags = { some: { tag: { name: filter.tag } } };
    }
    if (filter.author) {
      where.author = { username: filter.author };
    }
    if (filter.favorited) {
      where.favorites = { some: { user: { username: filter.favorited } } };
    }

    const [records, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: PrismaArticleRepository.includeTags,
        orderBy: { createdAt: 'desc' },
        skip: filter.offset,
        take: filter.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { articles: records.map((r) => this.toDomain(r)), total };
  }

  async feed(userId: number, filter: FeedFilter): Promise<ArticleListResult> {
    const where: Prisma.ArticleWhereInput = {
      author: { followers: { some: { followerId: userId } } },
    };

    const [records, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: PrismaArticleRepository.includeTags,
        orderBy: { createdAt: 'desc' },
        skip: filter.offset,
        take: filter.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { articles: records.map((r) => this.toDomain(r)), total };
  }

  async update(id: number, input: UpdateArticleInput): Promise<Article> {
    const record = await this.prisma.article.update({
      where: { id },
      data: input,
      include: PrismaArticleRepository.includeTags,
    });
    return this.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  async addFavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
  }

  async removeFavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, articleId } });
  }

  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const found = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });
    return found !== null;
  }

  async favoritesCount(articleId: number): Promise<number> {
    return this.prisma.favorite.count({ where: { articleId } });
  }
}
