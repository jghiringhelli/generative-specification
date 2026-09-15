import { Prisma, PrismaClient } from '@prisma/client';
import { IArticleRepository } from './IArticleRepository';
import {
  ArticleListFilter,
  ArticleListResult,
  ArticleWithAuthor,
  CreateArticleData,
  FeedFilter,
  UpdateArticleData,
} from '../domain/entities';

const articleInclude = {
  author: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;

type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

function toArticleWithAuthor(row: ArticleRow): ArticleWithAuthor {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    tagList: row.tags.map((link) => link.tag.name).sort(),
    authorId: row.authorId,
    favoritesCount: row.favoritesCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: row.author,
  };
}

/**
 * Prisma-backed driven adapter implementing {@link IArticleRepository}.
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateArticleData): Promise<ArticleWithAuthor> {
    const row = await this.prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: data.tagList.map((name) => ({
            tag: {
              connectOrCreate: { where: { name }, create: { name } },
            },
          })),
        },
      },
      include: articleInclude,
    });
    return toArticleWithAuthor(row);
  }

  async findBySlug(slug: string): Promise<ArticleWithAuthor | null> {
    const row = await this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });
    return row ? toArticleWithAuthor(row) : null;
  }

  async update(id: string, data: UpdateArticleData): Promise<ArticleWithAuthor> {
    const row = await this.prisma.article.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
      },
      include: articleInclude,
    });
    return toArticleWithAuthor(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
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
    return this.queryPaged(where, filter.limit, filter.offset);
  }

  async feed(filter: FeedFilter): Promise<ArticleListResult> {
    const where: Prisma.ArticleWhereInput = {
      author: { followers: { some: { followerId: filter.userId } } },
    };
    return this.queryPaged(where, filter.limit, filter.offset);
  }

  private async queryPaged(
    where: Prisma.ArticleWhereInput,
    limit: number,
    offset: number,
  ): Promise<ArticleListResult> {
    const [rows, articlesCount] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { articles: rows.map(toArticleWithAuthor), articlesCount };
  }

  async favorite(userId: string, articleId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.favorite.findUnique({
        where: { userId_articleId: { userId, articleId } },
      });
      if (existing) {
        return;
      }
      await tx.favorite.create({ data: { userId, articleId } });
      await tx.article.update({
        where: { id: articleId },
        data: { favoritesCount: { increment: 1 } },
      });
    });
  }

  async unfavorite(userId: string, articleId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.favorite.findUnique({
        where: { userId_articleId: { userId, articleId } },
      });
      if (!existing) {
        return;
      }
      await tx.favorite.delete({
        where: { userId_articleId: { userId, articleId } },
      });
      await tx.article.update({
        where: { id: articleId },
        data: { favoritesCount: { decrement: 1 } },
      });
    });
  }

  async isFavorited(userId: string, articleId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });
    return favorite !== null;
  }

  async favoritesCount(articleId: string): Promise<number> {
    return this.prisma.favorite.count({ where: { articleId } });
  }
}
