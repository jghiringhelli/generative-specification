import slugify from 'slugify';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type {
  ArticleFilters,
  ArticleRecord,
  IArticleRepository,
  UpdateArticleRecord,
} from '../repositories/IArticleRepository';

const DEFAULT_LIMIT = 20;
const MAXIMUM_LIMIT = 100;

export interface CreateArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: ReadonlyArray<string>;
}

export interface ArticleResponse {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ArticleRecord['author'];
}

export type ArticleListItem = Omit<ArticleResponse, 'body'>;

export interface ListArticlesInput {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly viewerId?: string;
}

export class ArticleService {
  public constructor(private readonly articles: IArticleRepository) {}

  /** Lists articles without their body field. */
  public async list(input: ListArticlesInput): Promise<{ articles: ArticleListItem[]; articlesCount: number }> {
    const result = await this.articles.list(this.filters(input));
    return { articles: result.articles.map((article) => this.toListItem(article)), articlesCount: result.count };
  }

  /** Lists followed-author articles without their body field. */
  public async feed(userId: string, limit?: number, offset?: number) {
    const result = await this.articles.feed(userId, this.limit(limit), offset ?? 0);
    return { articles: result.articles.map((article) => this.toListItem(article)), articlesCount: result.count };
  }

  /** Returns one complete article. */
  public async get(slug: string, viewerId?: string): Promise<ArticleResponse> {
    return this.toResponse(await this.requireArticle(slug, viewerId));
  }

  /** Creates an article for the authenticated author. */
  public async create(input: CreateArticleInput, authorId: string): Promise<ArticleResponse> {
    const article = await this.articles.create({
      ...input,
      slug: slugify(input.title, { lower: true, strict: true }),
      authorId,
      tagList: [...new Set(input.tagList ?? [])],
    });
    return this.toResponse(article);
  }

  /** Updates an article when requested by its author. */
  public async update(slug: string, input: UpdateArticleRecord, userId: string): Promise<ArticleResponse> {
    const current = await this.requireOwned(slug, userId);
    const data = { ...input, slug: input.title ? slugify(input.title, { lower: true, strict: true }) : undefined };
    return this.toResponse(await this.articles.update(current.id, data, userId));
  }

  /** Deletes an article when requested by its author. */
  public async delete(slug: string, userId: string): Promise<void> {
    const article = await this.requireOwned(slug, userId);
    await this.articles.delete(article.id);
  }

  /** Favorites an article for the authenticated user. */
  public async favorite(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug, userId);
    await this.articles.favorite(article.id, userId);
    return this.get(slug, userId);
  }

  /** Removes an authenticated user's article favorite. */
  public async unfavorite(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug, userId);
    await this.articles.unfavorite(article.id, userId);
    return this.get(slug, userId);
  }

  private filters(input: ListArticlesInput): ArticleFilters {
    return { tag: input.tag, author: input.author, favoritedBy: input.favorited, limit: this.limit(input.limit), offset: input.offset ?? 0, viewerId: input.viewerId };
  }

  private limit(value?: number): number {
    return Math.min(value ?? DEFAULT_LIMIT, MAXIMUM_LIMIT);
  }

  private async requireArticle(slug: string, viewerId?: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug, viewerId);
    if (!article) throw new NotFoundError('Article not found', { slug });
    return article;
  }

  private async requireOwned(slug: string, userId: string): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug, userId);
    if (article.authorId !== userId) throw new ForbiddenError('Only the author may modify this article');
    return article;
  }

  private toResponse(article: ArticleRecord): ArticleResponse {
    return { slug: article.slug, title: article.title, description: article.description, body: article.body, tagList: article.tagList, createdAt: article.createdAt.toISOString(), updatedAt: article.updatedAt.toISOString(), favorited: article.favorited, favoritesCount: article.favoritesCount, author: article.author };
  }

  private toListItem(article: ArticleRecord): ArticleListItem {
    const { body: _body, ...item } = this.toResponse(article);
    return item;
  }
}
