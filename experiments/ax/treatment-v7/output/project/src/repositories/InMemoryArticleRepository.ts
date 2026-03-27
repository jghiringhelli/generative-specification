import type {
  Article,
  ArticleFilters,
  CreateArticleData,
  PaginatedArticles,
  Pagination,
  UpdateArticleData,
} from '../types/domain';
import type { IArticleRepository } from './IArticleRepository';
import type { IUserRepository } from './IUserRepository';
import { NotFoundError } from '../errors/AppError';

/**
 * In-memory implementation of `IArticleRepository` for unit tests.
 *
 * Two modes:
 *   1. Standalone (no userRepo): `create()` stubs the author as `'stub-author'`.
 *      Sufficient for service-level unit tests that verify article logic, not author names.
 *   2. Shared (userRepo injected): `create()` looks up the real author by `authorId`.
 *      Required for route-level integration tests that assert `article.author.username`.
 *
 * Stores articles in a Map keyed by slug. Favorites tracked in a separate Map.
 * Does not implement follow-based filtering in `findFeed` — returns all articles.
 *
 * Use `seed()` to pre-populate and `clear()` between test cases.
 */
export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articles: Map<string, Article> = new Map();
  private readonly favoritesBySlug: Map<string, Set<number>> = new Map();
  private nextId = 1;

  constructor(private readonly userRepo?: IUserRepository) {}

  /**
   * Pre-populate the repository with existing articles.
   * Clears current state before seeding.
   *
   * @param articles - Articles to seed (must have unique slugs)
   */
  seed(articles: Article[]): void {
    this.articles.clear();
    this.favoritesBySlug.clear();
    this.nextId = 1;
    for (const article of articles) {
      this.articles.set(article.slug, { ...article });
      if (article.id >= this.nextId) this.nextId = article.id + 1;
    }
  }

  /** Remove all articles and favorites. */
  clear(): void {
    this.articles.clear();
    this.favoritesBySlug.clear();
    this.nextId = 1;
  }

  /** @inheritdoc */
  async findBySlug(slug: string, currentUserId?: number): Promise<Article | null> {
    const article = this.articles.get(slug);
    if (!article) return null;
    return this.withViewerContext(article, currentUserId);
  }

  /** @inheritdoc */
  async findAll(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number,
  ): Promise<PaginatedArticles> {
    let articles = Array.from(this.articles.values());

    if (filters.tag) {
      const tag = filters.tag;
      articles = articles.filter((a) => a.tagList.includes(tag));
    }
    if (filters.author) {
      const author = filters.author;
      articles = articles.filter((a) => a.author.username === author);
    }
    if (filters.favorited) {
      const favoritedBy = filters.favorited;
      // In-memory: we can only check by userId since we don't store username→id mapping.
      // Tests that need favorited filtering should use integration tests with Prisma.
      // Fall through without filtering to avoid silent test failures.
      void favoritedBy;
    }

    articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const articlesCount = articles.length;
    const paginated = articles.slice(pagination.offset, pagination.offset + pagination.limit);

    return {
      articles: paginated.map((a) => this.withViewerContext(a, currentUserId)),
      articlesCount,
    };
  }

  /** @inheritdoc */
  async findFeed(userId: number, pagination: Pagination): Promise<PaginatedArticles> {
    // In-memory: no follow tracking. Returns all articles ordered by date.
    // Unit tests that need accurate feed results should use integration tests.
    const articles = Array.from(this.articles.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const articlesCount = articles.length;
    const paginated = articles.slice(pagination.offset, pagination.offset + pagination.limit);

    return {
      articles: paginated.map((a) => this.withViewerContext(a, userId)),
      articlesCount,
    };
  }

  /** @inheritdoc */
  async create(authorId: number, data: CreateArticleData): Promise<Article> {
    const id = this.nextId++;
    const slug = `${data.title.toLowerCase().replace(/[\s]+/g, '-')}-${id}`;

    // Look up real author info when a user repository is available (route test mode).
    const user = this.userRepo ? await this.userRepo.findById(authorId) : null;
    const author = user
      ? { username: user.username, bio: user.bio, image: user.image, following: false }
      : { username: 'stub-author', bio: null, image: null, following: false };

    const article: Article = {
      id,
      slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId,
      author,
      tagList: data.tagList,
      favoritesCount: 0,
      favorited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.articles.set(slug, article);
    return { ...article };
  }

  /** @inheritdoc */
  async update(slug: string, data: UpdateArticleData): Promise<Article> {
    const existing = this.articles.get(slug);
    if (!existing) throw new NotFoundError('article');

    const newTitle = data.title ?? existing.title;
    const newSlug =
      data.title !== undefined
        ? `${newTitle.toLowerCase().replace(/[\s]+/g, '-')}-${existing.id}`
        : slug;

    const updated: Article = {
      ...existing,
      slug: newSlug,
      title: newTitle,
      description: data.description ?? existing.description,
      body: data.body ?? existing.body,
      tagList: data.tagList ?? existing.tagList,
      updatedAt: new Date(),
    };

    if (newSlug !== slug) {
      this.articles.delete(slug);
      const favs = this.favoritesBySlug.get(slug);
      if (favs) {
        this.favoritesBySlug.set(newSlug, favs);
        this.favoritesBySlug.delete(slug);
      }
    }
    this.articles.set(newSlug, updated);
    return { ...updated };
  }

  /** @inheritdoc */
  async delete(slug: string): Promise<void> {
    if (!this.articles.has(slug)) throw new NotFoundError('article');
    this.articles.delete(slug);
    this.favoritesBySlug.delete(slug);
  }

  /** @inheritdoc */
  async addFavorite(userId: number, slug: string): Promise<Article> {
    const article = this.articles.get(slug);
    if (!article) throw new NotFoundError('article');

    let favs = this.favoritesBySlug.get(slug);
    if (!favs) {
      favs = new Set();
      this.favoritesBySlug.set(slug, favs);
    }
    favs.add(userId);

    return this.withViewerContext(article, userId);
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, slug: string): Promise<Article> {
    const article = this.articles.get(slug);
    if (!article) throw new NotFoundError('article');

    const favs = this.favoritesBySlug.get(slug);
    if (favs) favs.delete(userId);

    return this.withViewerContext(article, userId);
  }

  /**
   * Enrich an article with viewer-relative `favorited` and `favoritesCount` fields.
   */
  private withViewerContext(article: Article, currentUserId?: number): Article {
    const favs = this.favoritesBySlug.get(article.slug) ?? new Set<number>();
    return {
      ...article,
      favoritesCount: favs.size,
      favorited: currentUserId !== undefined ? favs.has(currentUserId) : false,
    };
  }
}
