import { IArticleRepository, ArticleListResult } from '../../src/repositories/IArticleRepository';
import {
  ArticleEntity,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput
} from '../../src/domain/types';
import { InMemoryUserRepository } from './InMemoryUserRepository';

/**
 * In-memory fake implementation of {@link IArticleRepository} for tests. Uses
 * the user repository to resolve author/favoritedBy usernames to ids.
 */
export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articles: ArticleEntity[] = [];
  private readonly favorites = new Set<string>();
  private nextId = 1;

  /**
   * @param users - In-memory user repository for username resolution.
   */
  constructor(private readonly users: InMemoryUserRepository) {}

  /**
   * Build the composite favorite key.
   * @param userId - User id.
   * @param articleId - Article id.
   * @returns The key.
   */
  private favoriteKey(userId: number, articleId: number): string {
    return `${userId}:${articleId}`;
  }

  /** @inheritdoc */
  async findBySlug(slug: string): Promise<ArticleEntity | null> {
    const found = this.articles.find((a) => a.slug === slug);
    return found ? { ...found, tagList: [...found.tagList] } : null;
  }

  /** @inheritdoc */
  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    let matches = [...this.articles].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    if (filter.tag) {
      matches = matches.filter((a) => a.tagList.includes(filter.tag as string));
    }
    if (filter.author) {
      const author = await this.users.findByUsername(filter.author);
      matches = author ? matches.filter((a) => a.authorId === author.id) : [];
    }
    if (filter.favoritedBy) {
      const user = await this.users.findByUsername(filter.favoritedBy);
      matches = user
        ? matches.filter((a) => this.favorites.has(this.favoriteKey(user.id, a.id)))
        : [];
    }
    return this.paginate(matches, filter.limit, filter.offset);
  }

  /** @inheritdoc */
  async feed(authorIds: number[], filter: FeedFilter): Promise<ArticleListResult> {
    const matches = [...this.articles]
      .filter((a) => authorIds.includes(a.authorId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return this.paginate(matches, filter.limit, filter.offset);
  }

  /**
   * Apply pagination and clone results.
   * @param matches - Filtered, sorted articles.
   * @param limit - Page size.
   * @param offset - Page offset.
   * @returns The page and total.
   */
  private paginate(matches: ArticleEntity[], limit: number, offset: number): ArticleListResult {
    const page = matches.slice(offset, offset + limit).map((a) => ({ ...a, tagList: [...a.tagList] }));
    return { articles: page, total: matches.length };
  }

  /** @inheritdoc */
  async create(input: CreateArticleInput): Promise<ArticleEntity> {
    const now = new Date();
    const article: ArticleEntity = {
      id: this.nextId++,
      slug: input.slug,
      title: input.title,
      description: input.description,
      body: input.body,
      authorId: input.authorId,
      tagList: [...input.tagList],
      favoritesCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.articles.push(article);
    return { ...article, tagList: [...article.tagList] };
  }

  /** @inheritdoc */
  async update(id: number, input: UpdateArticleInput): Promise<ArticleEntity> {
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new Error(`Article ${id} not found`);
    }
    if (input.slug !== undefined) article.slug = input.slug;
    if (input.title !== undefined) article.title = input.title;
    if (input.description !== undefined) article.description = input.description;
    if (input.body !== undefined) article.body = input.body;
    article.updatedAt = new Date();
    return { ...article, tagList: [...article.tagList] };
  }

  /** @inheritdoc */
  async delete(id: number): Promise<void> {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.articles.splice(index, 1);
    }
  }

  /** @inheritdoc */
  async addFavorite(userId: number, articleId: number): Promise<void> {
    const key = this.favoriteKey(userId, articleId);
    if (this.favorites.has(key)) {
      return;
    }
    this.favorites.add(key);
    const article = this.articles.find((a) => a.id === articleId);
    if (article) {
      article.favoritesCount += 1;
    }
  }

  /** @inheritdoc */
  async removeFavorite(userId: number, articleId: number): Promise<void> {
    const key = this.favoriteKey(userId, articleId);
    if (!this.favorites.has(key)) {
      return;
    }
    this.favorites.delete(key);
    const article = this.articles.find((a) => a.id === articleId);
    if (article && article.favoritesCount > 0) {
      article.favoritesCount -= 1;
    }
  }

  /** @inheritdoc */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    return this.favorites.has(this.favoriteKey(userId, articleId));
  }

  /** @inheritdoc */
  async favoritesCount(articleId: number): Promise<number> {
    let count = 0;
    for (const key of this.favorites) {
      if (Number(key.split(':')[1]) === articleId) {
        count += 1;
      }
    }
    return count;
  }

  /**
   * Expose the set of all tags across articles (for the tag repository fake).
   * @returns Distinct tag names.
   */
  allTags(): string[] {
    const set = new Set<string>();
    for (const article of this.articles) {
      for (const tag of article.tagList) {
        set.add(tag);
      }
    }
    return [...set];
  }
}
