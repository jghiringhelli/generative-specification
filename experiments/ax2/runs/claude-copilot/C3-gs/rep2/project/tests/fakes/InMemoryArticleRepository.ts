import { IArticleRepository, ArticleListResult } from '../../src/repositories/IArticleRepository';
import {
  Article,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput,
} from '../../src/domain/types';
import { InMemoryProfileRepository } from './InMemoryProfileRepository';
import { InMemoryUserRepository } from './InMemoryUserRepository';

/**
 * In-memory fake implementing {@link IArticleRepository}. Depends on the user
 * and profile fakes to resolve author/favorited/feed filters.
 */
export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articles = new Map<number, Article>();
  private readonly favorites = new Set<string>();
  private nextId = 1;

  /**
   * @param users - User fake (for author/favorited username resolution).
   * @param profiles - Profile fake (for feed follow resolution).
   */
  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly profiles: InMemoryProfileRepository,
  ) {}

  /**
   * Composite key for a favorite edge.
   * @param userId - User id.
   * @param articleId - Article id.
   * @returns Edge key.
   */
  private favKey(userId: number, articleId: number): string {
    return `${userId}:${articleId}`;
  }

  /** @inheritdoc */
  async create(input: CreateArticleInput): Promise<Article> {
    const now = new Date();
    const article: Article = {
      id: this.nextId++,
      slug: input.slug,
      title: input.title,
      description: input.description,
      body: input.body,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
      tagList: [...input.tagList].sort(),
    };
    this.articles.set(article.id, article);
    return { ...article };
  }

  /** @inheritdoc */
  async findBySlug(slug: string): Promise<Article | null> {
    for (const article of this.articles.values()) {
      if (article.slug === slug) {
        return { ...article };
      }
    }
    return null;
  }

  /** @inheritdoc */
  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    let items = this.sorted();
    if (filter.tag) {
      items = items.filter((a) => a.tagList.includes(filter.tag as string));
    }
    if (filter.author) {
      const author = await this.users.findByUsername(filter.author);
      items = author ? items.filter((a) => a.authorId === author.id) : [];
    }
    if (filter.favorited) {
      const user = await this.users.findByUsername(filter.favorited);
      items = user
        ? items.filter((a) => this.favorites.has(this.favKey(user.id, a.id)))
        : [];
    }
    return this.paginate(items, filter.limit, filter.offset);
  }

  /** @inheritdoc */
  async feed(userId: number, filter: FeedFilter): Promise<ArticleListResult> {
    const followed = new Set(this.profiles.followingIds(userId));
    const items = this.sorted().filter((a) => followed.has(a.authorId));
    return this.paginate(items, filter.limit, filter.offset);
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateArticleInput): Promise<Article> {
    const existing = this.articles.get(id);
    if (!existing) {
      throw new Error(`Article ${id} not found`);
    }
    const updated: Article = {
      ...existing,
      slug: input.slug ?? existing.slug,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      body: input.body ?? existing.body,
      updatedAt: new Date(),
    };
    this.articles.set(id, updated);
    return { ...updated };
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    this.articles.delete(id);
  }

  /** @inheritdoc */
  async addFavorite(userId: number, articleId: number): Promise<void> {
    this.favorites.add(this.favKey(userId, articleId));
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, articleId: number): Promise<void> {
    this.favorites.delete(this.favKey(userId, articleId));
  }

  /** @inheritdoc */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    return this.favorites.has(this.favKey(userId, articleId));
  }

  /** @inheritdoc */
  async favoritesCount(articleId: number): Promise<number> {
    let count = 0;
    for (const edge of this.favorites) {
      if (Number(edge.split(':')[1]) === articleId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Articles sorted newest-first (stable by descending id for equal times).
   * @returns Sorted article copies.
   */
  private sorted(): Article[] {
    return [...this.articles.values()].sort((a, b) => b.id - a.id).map((a) => ({ ...a }));
  }

  /**
   * Apply pagination to a filtered list.
   * @param items - Filtered articles.
   * @param limit - Page size.
   * @param offset - Page offset.
   * @returns Page and total count.
   */
  private paginate(items: Article[], limit: number, offset: number): ArticleListResult {
    return {
      articles: items.slice(offset, offset + limit),
      articlesCount: items.length,
    };
  }
}
