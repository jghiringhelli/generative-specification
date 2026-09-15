import {
  ArticleQuery,
  ArticleRecord,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from '../../src/repositories/IArticleRepository';

export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articles = new Map<string, ArticleRecord>();
  private readonly tags = new Map<string, ReadonlyArray<string>>();
  private readonly favorites = new Set<string>();
  private readonly followedAuthors = new Map<string, Set<string>>();
  private readonly usernames = new Map<string, string>();
  private nextId = 1;

  public async create(data: CreateArticleData): Promise<ArticleRecord> {
    const now = new Date();
    const article = {
      id: String(this.nextId++),
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(article.id, article);
    this.tags.set(article.id, [...data.tagList]);
    return article;
  }

  public async findBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.values().find((article) => article.slug === slug) ?? null;
  }

  public async list(query: ArticleQuery): Promise<ReadonlyArray<ArticleRecord>> {
    return this.filtered(query).slice(query.offset, query.offset + query.limit);
  }

  public async count(query: ArticleQuery): Promise<number> {
    return this.filtered(query).length;
  }

  public async listFeed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ReadonlyArray<ArticleRecord>> {
    const authorIds = this.followedAuthors.get(userId) ?? new Set<string>();
    return this.values()
      .filter((article) => authorIds.has(article.authorId))
      .slice(offset, offset + limit);
  }

  public async countFeed(userId: string): Promise<number> {
    const authorIds = this.followedAuthors.get(userId) ?? new Set<string>();
    return this.values().filter((article) => authorIds.has(article.authorId)).length;
  }

  public async update(id: string, data: UpdateArticleData): Promise<ArticleRecord> {
    const current = this.articles.get(id);
    if (!current) {
      throw new Error(`Missing test article ${id}`);
    }
    const changes = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    const updated = { ...current, ...changes, updatedAt: new Date() };
    this.articles.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<void> {
    this.articles.delete(id);
    this.tags.delete(id);
  }

  public async favorite(articleId: string, userId: string): Promise<void> {
    this.favorites.add(this.favoriteKey(articleId, userId));
  }

  public async unfavorite(articleId: string, userId: string): Promise<void> {
    this.favorites.delete(this.favoriteKey(articleId, userId));
  }

  public async isFavorited(articleId: string, userId: string): Promise<boolean> {
    return this.favorites.has(this.favoriteKey(articleId, userId));
  }

  public async countFavorites(articleId: string): Promise<number> {
    return [...this.favorites].filter((key) => key.startsWith(`${articleId}:`)).length;
  }

  public async getTags(articleId: string): Promise<ReadonlyArray<string>> {
    return this.tags.get(articleId) ?? [];
  }

  public followAuthor(userId: string, authorId: string): void {
    const current = this.followedAuthors.get(userId) ?? new Set<string>();
    current.add(authorId);
    this.followedAuthors.set(userId, current);
  }

  public setUsername(userId: string, username: string): void {
    this.usernames.set(userId, username);
  }

  private filtered(query: ArticleQuery): ReadonlyArray<ArticleRecord> {
    return this.values().filter((article) => {
      const tagMatches = !query.tag || this.tags.get(article.id)?.includes(query.tag);
      const authorMatches = !query.author
        || this.usernames.get(article.authorId) === query.author;
      const favoriteMatches = !query.favoritedBy
        || this.isFavoritedByUsername(article.id, query.favoritedBy);
      return tagMatches && authorMatches && favoriteMatches;
    });
  }

  private values(): ReadonlyArray<ArticleRecord> {
    return [...this.articles.values()].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );
  }

  private favoriteKey(articleId: string, userId: string): string {
    return `${articleId}:${userId}`;
  }

  private isFavoritedByUsername(articleId: string, username: string): boolean {
    return [...this.favorites].some((key) => {
      const [favoriteArticleId, userId] = key.split(':');
      return favoriteArticleId === articleId && this.usernames.get(userId) === username;
    });
  }
}
