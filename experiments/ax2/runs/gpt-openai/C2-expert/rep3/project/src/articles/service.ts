import { ApplicationError } from '../errors/application-error';
import { ArticleRepository, type ArticleRecord } from './repository';
import type { ArticleInput, ArticleUpdateInput, ListArticlesInput } from './schemas';

interface ArticleBase {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tagList: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: { username: string; bio: string | null; image: string | null; following: boolean };
}

export type ArticleResponse = { readonly article: ArticleBase & { readonly body: string } };
export type ArticlesResponse = { readonly articles: ArticleBase[]; readonly articlesCount: number };

export class ArticleService {
  public constructor(private readonly articles: ArticleRepository) {}

  /** Lists articles without article bodies. */
  public async list(input: ListArticlesInput, viewerId?: number): Promise<ArticlesResponse> {
    const result = await this.articles.list(input);
    return { articles: result.records.map((record) => this.toBase(record, viewerId)), articlesCount: result.count };
  }

  /** Lists followed-author articles without article bodies. */
  public async feed(viewerId: number, input: ListArticlesInput): Promise<ArticlesResponse> {
    const result = await this.articles.feed(viewerId, input);
    return { articles: result.records.map((record) => this.toBase(record, viewerId)), articlesCount: result.count };
  }

  /** Gets one complete article. */
  public async get(slug: string, viewerId?: number): Promise<ArticleResponse> {
    const record = await this.requireArticle(slug);
    return { article: { ...this.toBase(record, viewerId), body: record.body } };
  }

  /** Creates an article. */
  public async create(authorId: number, input: ArticleInput): Promise<ArticleResponse> {
    const record = await this.articles.create(authorId, this.slugify(input.title), input);
    return { article: { ...this.toBase(record, authorId), body: record.body } };
  }

  /** Updates an article owned by the user. */
  public async update(slug: string, userId: number, input: ArticleUpdateInput): Promise<ArticleResponse> {
    const existing = await this.requireOwned(slug, userId);
    const data = { ...input, ...(input.title && { slug: this.slugify(input.title) }) };
    const record = await this.articles.update(existing.id, data);
    return { article: { ...this.toBase(record, userId), body: record.body } };
  }

  /** Deletes an article owned by the user. */
  public async delete(slug: string, userId: number): Promise<void> {
    const existing = await this.requireOwned(slug, userId);
    await this.articles.delete(existing.id);
  }

  /** Favorites an article idempotently. */
  public async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const existing = await this.requireArticle(slug);
    await this.articles.favorite(userId, existing.id);
    return this.get(slug, userId);
  }

  /** Unfavorites an article idempotently. */
  public async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const existing = await this.requireArticle(slug);
    await this.articles.unfavorite(userId, existing.id);
    return this.get(slug, userId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const record = await this.articles.findBySlug(slug);
    if (!record) throw new ApplicationError('Article not found', 404);
    return record;
  }

  private async requireOwned(slug: string, userId: number): Promise<ArticleRecord> {
    const record = await this.requireArticle(slug);
    if (record.authorId !== userId) throw new ApplicationError('Only the author may modify this article', 403);
    return record;
  }

  private slugify(title: string): string {
    const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${base}-${Date.now()}`;
  }

  private toBase(record: ArticleRecord, viewerId?: number): ArticleBase {
    return {
      slug: record.slug, title: record.title, description: record.description,
      tagList: record.tags.map(({ tag }) => tag.name), createdAt: record.createdAt, updatedAt: record.updatedAt,
      favorited: record.favorites.some(({ userId }) => userId === viewerId), favoritesCount: record.favorites.length,
      author: { username: record.author.username, bio: record.author.bio, image: record.author.image, following: record.author.followers.some(({ followerId }) => followerId === viewerId) },
    };
  }
}

