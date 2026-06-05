/**
 * Prisma-backed {@link IArticleRepository} — the production article adapter.
 *
 * Maps the Article aggregate and its favorites join. `favoritesCount` is derived
 * via `_count` (never stored); `delete` is a soft delete (sets `deletedAt`) and
 * every read filters `deletedAt: null`, honouring operation-classification
 * Tier 3 (no hard delete of domain entities). Filtering and the follow graph are
 * resolved to ids by the service, so this adapter never touches users directly.
 *
 * Exercised by the real-database integration suite (auto-skipped when no
 * `DATABASE_URL` is reachable) and excluded from the unit-coverage denominator
 * in jest.config.js, since it is thin I/O verified against a real Postgres. Its
 * behavioural contract is covered identically by InMemoryArticleRepository.
 *
 * @gs-links: docs/specs/articles.md, docs/adrs/ADR-0002-auth.md
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../errors/AppError.js';
import type {
  Article,
  ArticleListQuery,
  ArticlePage,
  ArticleUpdate,
  FeedQuery,
  IArticleRepository,
  NewArticle,
} from '../../repositories/IArticleRepository.js';

/** Row shape selected from Prisma, including the derived favorites count. */
type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { favoritedBy: number };
};

const rowSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  body: true,
  tagList: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { favoritedBy: true } },
} satisfies Prisma.ArticleSelect;

export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async create(input: NewArticle): Promise<Article> {
    const row = await this.prisma.article.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        body: input.body,
        tagList: [...input.tagList],
        authorId: input.authorId,
      },
      select: rowSelect,
    });
    return toArticle(row);
  }

  /** @inheritdoc */
  async findBySlug(slug: string): Promise<Article | null> {
    const row = await this.prisma.article.findFirst({
      where: { slug, deletedAt: null },
      select: rowSelect,
    });
    return row ? toArticle(row) : null;
  }

  /** @inheritdoc */
  async list(query: ArticleListQuery): Promise<ArticlePage> {
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      ...(query.tag !== undefined ? { tagList: { has: query.tag } } : {}),
      ...(query.authorId !== undefined ? { authorId: query.authorId } : {}),
      ...(query.favoritedByUserId !== undefined
        ? { favoritedBy: { some: { userId: query.favoritedByUserId } } }
        : {}),
    };
    return this.page(where, query.limit, query.offset);
  }

  /** @inheritdoc */
  async feed(query: FeedQuery): Promise<ArticlePage> {
    if (query.authorIds.length === 0) {
      return { articles: [], total: 0 };
    }
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      authorId: { in: [...query.authorIds] },
    };
    return this.page(where, query.limit, query.offset);
  }

  /** @inheritdoc */
  async update(slug: string, changes: ArticleUpdate): Promise<Article> {
    const existing = await this.prisma.article.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundError('Article', slug);
    const row = await this.prisma.article.update({
      where: { id: existing.id },
      data: {
        ...(changes.slug !== undefined ? { slug: changes.slug } : {}),
        ...(changes.title !== undefined ? { title: changes.title } : {}),
        ...(changes.description !== undefined ? { description: changes.description } : {}),
        ...(changes.body !== undefined ? { body: changes.body } : {}),
        ...(changes.tagList !== undefined ? { tagList: { set: [...changes.tagList] } } : {}),
      },
      select: rowSelect,
    });
    return toArticle(row);
  }

  /** @inheritdoc — soft delete by specific slug (never an unscoped delete). */
  async delete(slug: string): Promise<void> {
    const result = await this.prisma.article.updateMany({
      where: { slug, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundError('Article', slug);
  }

  /** @inheritdoc */
  async addFavorite(articleId: string, userId: string): Promise<Article> {
    await this.prisma.articleFavorite.upsert({
      where: { articleId_userId: { articleId, userId } },
      create: { articleId, userId },
      update: {},
    });
    return this.requireById(articleId);
  }

  /** @inheritdoc */
  async removeFavorite(articleId: string, userId: string): Promise<Article> {
    await this.prisma.articleFavorite.deleteMany({ where: { articleId, userId } });
    return this.requireById(articleId);
  }

  /** @inheritdoc */
  async isFavorited(articleId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.articleFavorite.count({ where: { articleId, userId } });
    return count > 0;
  }

  /** @inheritdoc — distinct tags across live articles, sorted for determinism. */
  async listTags(): Promise<ReadonlyArray<string>> {
    const rows = await this.prisma.article.findMany({
      where: { deletedAt: null },
      select: { tagList: true },
    });
    const tags = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tagList) tags.add(tag);
    }
    return [...tags].sort();
  }

  /** Run a filtered, paginated, newest-first query plus its total count. */
  private async page(
    where: Prisma.ArticleWhereInput,
    limit: number,
    offset: number,
  ): Promise<ArticlePage> {
    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: rowSelect,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { articles: rows.map(toArticle), total };
  }

  /** Re-read an article by id (after a favorite mutation), or 404. */
  private async requireById(articleId: string): Promise<Article> {
    const row = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: rowSelect,
    });
    if (!row) throw new NotFoundError('Article', articleId);
    return toArticle(row);
  }
}

/** Project a Prisma row (with `_count`) into the domain {@link Article}. */
function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    tagList: row.tagList,
    authorId: row.authorId,
    favoritesCount: row._count.favoritedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
