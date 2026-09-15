import { PrismaClient, Prisma } from '@prisma/client';
import { IArticleRepository, ArticleListResult } from './IArticleRepository';
import {
  Article,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput,
} from '../domain/types';

type ArticleWithTags = Prisma.ArticleGetPayload<{ include: { tags: { include: { tag: true } } } }>;

/**
 * Prisma-backed driven adapter implementing {@link IArticleRepository}.
 */
export class PrismaArticleRepository implements IArticleRepository {
  private readonly prisma: PrismaClient;

  /**
   * @param prisma - Injected Prisma client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** @inheritdoc */
  async create(input: CreateArticleInput): Promise<Article> {
    const created = await this.prisma.article.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        body: input.body,
        authorId: input.authorId,
        tags: {
          create: input.tagList.map((name) => ({
            tag: {
              connectOrCreate: { where: { name }, create: { name } },
            },
          })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });
    return this.toDomain(created);
  }

  /** @inheritdoc */
  async findBySlug(slug: string): Promise<Article | null> {
    const found = await this.prisma.article.findUnique({
      where: { slug },
      include: { tags: { include: { tag: true } } },
    });
    return found ? this.toDomain(found) : null;
  }

  /** @inheritdoc */
  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    const where = this.buildListWhere(filter);
    return this.queryPage(where, filter.limit, filter.offset);
  }

  /** @inheritdoc */
  async feed(userId: number, filter: FeedFilter): Promise<ArticleListResult> {
    const where: Prisma.ArticleWhereInput = {
      author: { followers: { some: { followerId: userId } } },
    };
    return this.queryPage(where, filter.limit, filter.offset);
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateArticleInput): Promise<Article> {
    const updated = await this.prisma.article.update({
      where: { id },
      data: input,
      include: { tags: { include: { tag: true } } },
    });
    return this.toDomain(updated);
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }

  /** @inheritdoc */
  async addFavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, articleId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, articleId } });
  }

  /** @inheritdoc */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const found = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });
    return found !== null;
  }

  /** @inheritdoc */
  async favoritesCount(articleId: number): Promise<number> {
    return this.prisma.favorite.count({ where: { articleId } });
  }

  /**
   * Build the Prisma where clause for a list query from filters.
   * @param filter - Tag/author/favorited filters.
   * @returns Prisma where input.
   */
  private buildListWhere(filter: ArticleListFilter): Prisma.ArticleWhereInput {
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
    return where;
  }

  /**
   * Execute a paged, ordered article query and map to domain objects.
   * @param where - Prisma where clause.
   * @param limit - Page size.
   * @param offset - Page offset.
   * @returns Articles and total count.
   */
  private async queryPage(
    where: Prisma.ArticleWhereInput,
    limit: number,
    offset: number,
  ): Promise<ArticleListResult> {
    const [rows, articlesCount] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { articles: rows.map((row) => this.toDomain(row)), articlesCount };
  }

  /**
   * Map a Prisma article row (with tags) to the domain Article type.
   * @param row - Prisma article with included tags.
   * @returns Domain article.
   */
  private toDomain(row: ArticleWithTags): Article {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      body: row.body,
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tagList: row.tags.map((articleTag) => articleTag.tag.name).sort(),
    };
  }
}
