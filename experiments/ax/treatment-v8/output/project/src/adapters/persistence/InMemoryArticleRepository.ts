/**
 * In-memory {@link IArticleRepository}.
 *
 * A genuine working implementation (a Fake, not a mock) of the article
 * persistence port: it holds articles, a favorites graph, and soft-delete
 * state, enforcing the same observable contract the database does — recency
 * ordering, filtering, a derived favorites count, and exclusion of
 * soft-deleted rows from every read. Used as the driven adapter in
 * subcutaneous tests and for local development without a database. Production
 * wiring uses {@link PrismaArticleRepository}.
 *
 * @gs-links: docs/specs/articles.md
 */
import { randomUUID } from 'node:crypto';
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

/** Stored article record: the wire-facing fields plus internal bookkeeping. */
interface StoredArticle {
  readonly id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: ReadonlyArray<string>;
  readonly authorId: string;
  readonly createdAt: Date;
  updatedAt: Date;
  /** Monotonic insertion sequence — tie-breaks recency ordering deterministically. */
  readonly seq: number;
  deletedAt: Date | null;
}

export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articlesById = new Map<string, StoredArticle>();
  /** articleId → set of userIds who have favorited it. */
  private readonly favorites = new Map<string, Set<string>>();
  private seq = 0;

  /** @inheritdoc */
  create(input: NewArticle): Promise<Article> {
    const now = new Date();
    const stored: StoredArticle = {
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: [...input.tagList],
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
      seq: this.seq++,
      deletedAt: null,
    };
    this.articlesById.set(stored.id, stored);
    return Promise.resolve(this.toArticle(stored));
  }

  /** @inheritdoc */
  findBySlug(slug: string): Promise<Article | null> {
    const stored = this.liveBySlug(slug);
    return Promise.resolve(stored ? this.toArticle(stored) : null);
  }

  /** @inheritdoc */
  list(query: ArticleListQuery): Promise<ArticlePage> {
    const matched = this.live().filter((article) => {
      if (query.tag !== undefined && !article.tagList.includes(query.tag)) return false;
      if (query.authorId !== undefined && article.authorId !== query.authorId) return false;
      if (
        query.favoritedByUserId !== undefined &&
        !this.favoritesOf(article.id).has(query.favoritedByUserId)
      ) {
        return false;
      }
      return true;
    });
    return Promise.resolve(this.paginate(matched, query.limit, query.offset));
  }

  /** @inheritdoc */
  feed(query: FeedQuery): Promise<ArticlePage> {
    const authors = new Set(query.authorIds);
    const matched = this.live().filter((article) => authors.has(article.authorId));
    return Promise.resolve(this.paginate(matched, query.limit, query.offset));
  }

  /** @inheritdoc */
  update(slug: string, changes: ArticleUpdate): Promise<Article> {
    const stored = this.liveBySlug(slug);
    if (!stored) return Promise.reject(new NotFoundError('Article', slug));
    if (changes.slug !== undefined) stored.slug = changes.slug;
    if (changes.title !== undefined) stored.title = changes.title;
    if (changes.description !== undefined) stored.description = changes.description;
    if (changes.body !== undefined) stored.body = changes.body;
    if (changes.tagList !== undefined) stored.tagList = [...changes.tagList];
    stored.updatedAt = new Date();
    return Promise.resolve(this.toArticle(stored));
  }

  /** @inheritdoc — soft delete: the row is retained but excluded from all reads. */
  delete(slug: string): Promise<void> {
    const stored = this.liveBySlug(slug);
    if (!stored) return Promise.reject(new NotFoundError('Article', slug));
    stored.deletedAt = new Date();
    return Promise.resolve();
  }

  /** @inheritdoc */
  addFavorite(articleId: string, userId: string): Promise<Article> {
    const stored = this.liveById(articleId);
    if (!stored) return Promise.reject(new NotFoundError('Article', articleId));
    this.favoritesOf(articleId).add(userId);
    return Promise.resolve(this.toArticle(stored));
  }

  /** @inheritdoc */
  removeFavorite(articleId: string, userId: string): Promise<Article> {
    const stored = this.liveById(articleId);
    if (!stored) return Promise.reject(new NotFoundError('Article', articleId));
    this.favoritesOf(articleId).delete(userId);
    return Promise.resolve(this.toArticle(stored));
  }

  /** @inheritdoc */
  isFavorited(articleId: string, userId: string): Promise<boolean> {
    return Promise.resolve(this.favoritesOf(articleId).has(userId));
  }

  /** @inheritdoc — distinct tags across live articles, sorted for determinism. */
  listTags(): Promise<ReadonlyArray<string>> {
    const tags = new Set<string>();
    for (const article of this.live()) {
      for (const tag of article.tagList) tags.add(tag);
    }
    return Promise.resolve([...tags].sort());
  }

  /** Non-deleted articles, newest first (createdAt desc, seq desc tie-break). */
  private live(): StoredArticle[] {
    return [...this.articlesById.values()]
      .filter((article) => article.deletedAt === null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.seq - a.seq);
  }

  /** Slice an already-ordered match set into a page plus its total count. */
  private paginate(matched: StoredArticle[], limit: number, offset: number): ArticlePage {
    const page = matched.slice(offset, offset + limit).map((stored) => this.toArticle(stored));
    return { articles: page, total: matched.length };
  }

  private liveBySlug(slug: string): StoredArticle | undefined {
    return this.live().find((article) => article.slug === slug);
  }

  private liveById(id: string): StoredArticle | undefined {
    const stored = this.articlesById.get(id);
    return stored && stored.deletedAt === null ? stored : undefined;
  }

  /** The favorite set for an article, created on first access. */
  private favoritesOf(articleId: string): Set<string> {
    let set = this.favorites.get(articleId);
    if (!set) {
      set = new Set<string>();
      this.favorites.set(articleId, set);
    }
    return set;
  }

  /** Project a stored record into the domain {@link Article} (count derived). */
  private toArticle(stored: StoredArticle): Article {
    return {
      id: stored.id,
      slug: stored.slug,
      title: stored.title,
      description: stored.description,
      body: stored.body,
      tagList: [...stored.tagList],
      authorId: stored.authorId,
      favoritesCount: this.favoritesOf(stored.id).size,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }
}
