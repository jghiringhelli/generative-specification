import {
  ArticleQuery,
  ArticleRecord,
  CreateArticleRecord,
  IArticleRepository,
  UpdateArticleRecord,
} from '../../src/repositories/IArticleRepository';

export class InMemoryArticleRepository implements IArticleRepository {
  private readonly articles: ArticleRecord[] = [];
  private nextId = 1;

  public findBySlug(slug: string): Promise<ArticleRecord | null> {
    return Promise.resolve(this.articles.find((item) => item.slug === slug) ?? null);
  }

  public list(query: ArticleQuery): Promise<ReadonlyArray<ArticleRecord>> {
    return Promise.resolve(this.filtered(query).slice(
      query.offset,
      query.offset + query.limit,
    ));
  }

  public count(query: ArticleQuery): Promise<number> {
    return Promise.resolve(this.filtered(query).length);
  }

  public feed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ReadonlyArray<ArticleRecord>> {
    const items = this.articles.filter((article) =>
      article.author.followerIds.includes(userId));
    return Promise.resolve(items.slice(offset, offset + limit));
  }

  public countFeed(userId: string): Promise<number> {
    return Promise.resolve(this.articles.filter((article) =>
      article.author.followerIds.includes(userId)).length);
  }

  public create(data: CreateArticleRecord): Promise<ArticleRecord> {
    const now = new Date();
    const article: ArticleRecord = {
      ...data,
      id: String(this.nextId++),
      createdAt: now,
      updatedAt: now,
      author: {
        id: data.authorId,
        username: data.authorId === '1' ? 'alice' : 'bob',
        bio: null,
        image: null,
        followerIds: data.authorId === '2' ? ['1'] : [],
      },
      favoritedByIds: [],
    };
    this.articles.unshift(article);
    return Promise.resolve(article);
  }

  public update(id: string, data: UpdateArticleRecord): Promise<ArticleRecord> {
    const index = this.articles.findIndex((article) => article.id === id);
    if (index < 0) throw new Error(`Missing test article ${id}`);
    const updated = { ...this.articles[index]!, ...data, updatedAt: new Date() };
    this.articles[index] = updated;
    return Promise.resolve(updated);
  }

  public delete(id: string): Promise<void> {
    const index = this.articles.findIndex((article) => article.id === id);
    if (index >= 0) this.articles.splice(index, 1);
    return Promise.resolve();
  }

  public async favorite(articleId: string, userId: string): Promise<void> {
    this.changeFavorite(articleId, userId, true);
  }

  public async unfavorite(articleId: string, userId: string): Promise<void> {
    this.changeFavorite(articleId, userId, false);
  }

  private filtered(query: ArticleQuery): ArticleRecord[] {
    const favoritedById = query.favoritedBy
      ? this.userIdForUsername(query.favoritedBy)
      : undefined;
    return this.articles.filter((article) => {
      if (query.tag && !article.tagList.includes(query.tag)) return false;
      if (query.author && article.author.username !== query.author) return false;
      if (favoritedById && !article.favoritedByIds.includes(favoritedById)) {
        return false;
      }
      return true;
    });
  }

  private userIdForUsername(username: string): string {
    if (username === 'alice') return '1';
    if (username === 'bob') return '2';
    return username;
  }

  private changeFavorite(
    articleId: string,
    userId: string,
    favorited: boolean,
  ): void {
    const index = this.articles.findIndex((article) => article.id === articleId);
    const article = this.articles[index];
    if (!article) return;
    const ids = new Set(article.favoritedByIds);
    favorited ? ids.add(userId) : ids.delete(userId);
    this.articles[index] = { ...article, favoritedByIds: [...ids] };
  }
}
