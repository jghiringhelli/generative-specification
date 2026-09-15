import { Article, Prisma, PrismaClient } from '@prisma/client';
import {
  ArticleQuery,
  ArticleRecord,
  ArticleWrite,
  IArticleRepository,
} from './IArticleRepository';

type ArticleWithTags = Article & {
  tags: Array<{ tag: { name: string } }>;
};

export class PrismaArticleRepository implements IArticleRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async list(query: ArticleQuery): Promise<{ articles: readonly ArticleRecord[]; count: number }> {
    const where = this.where(query);
    const [rows, count] = await this.database.$transaction([
      this.database.article.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.database.article.count({ where }),
    ]);
    return { articles: rows.map((row) => this.map(row)), count };
  }

  public async findBySlug(slug: string): Promise<ArticleRecord | null> {
    const row = await this.database.article.findUnique({
      where: { slug },
      include: { tags: { include: { tag: true } } },
    });
    return row ? this.map(row) : null;
  }

  public async create(authorId: string, slug: string, input: ArticleWrite): Promise<ArticleRecord> {
    const row = await this.database.article.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        body: input.body,
        authorId,
        tags: { create: input.tagList.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })) },
      },
      include: { tags: { include: { tag: true } } },
    });
    return this.map(row);
  }

  public async update(
    id: string,
    slug: string,
    input: Partial<ArticleWrite>,
  ): Promise<ArticleRecord> {
    const tags = input.tagList ? {
      deleteMany: {},
      create: input.tagList.map((name) => ({
        tag: { connectOrCreate: { where: { name }, create: { name } } },
      })),
    } : undefined;
    const row = await this.database.article.update({
      where: { id },
      data: { title: input.title, description: input.description, body: input.body, slug, tags },
      include: { tags: { include: { tag: true } } },
    });
    return this.map(row);
  }

  public async delete(id: string): Promise<void> {
    await this.database.article.delete({ where: { id } });
  }

  public async favorite(articleId: string, userId: string): Promise<void> {
    await this.database.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
  }

  public async unfavorite(articleId: string, userId: string): Promise<void> {
    await this.database.favorite.deleteMany({ where: { articleId, userId } });
  }

  public async isFavorited(articleId: string, userId: string): Promise<boolean> {
    return Boolean(await this.database.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    }));
  }

  public favoriteCount(articleId: string): Promise<number> {
    return this.database.favorite.count({ where: { articleId } });
  }

  private where(query: ArticleQuery): Prisma.ArticleWhereInput {
    return {
      tags: query.tag ? { some: { tag: { name: query.tag } } } : undefined,
      favorites: query.favorited ? { some: { user: { username: query.favorited } } } : undefined,
      author: query.followerId
        ? {
          username: query.author,
          followers: { some: { followerId: query.followerId } },
        }
        : query.author ? { username: query.author } : undefined,
    };
  }

  private map(row: ArticleWithTags): ArticleRecord {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      body: row.body,
      tagList: row.tags.map(({ tag }) => tag.name),
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
