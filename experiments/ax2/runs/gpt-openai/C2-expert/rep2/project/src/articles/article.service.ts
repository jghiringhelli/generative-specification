import { ArticleForbiddenError, ArticleNotFoundError } from './article.errors';
import { ArticleRepositoryPort } from './article.repository';
import { createArticleSlug } from './slug';
import {
  ArticleFilters,
  ArticleRecord,
  ArticleResponse,
  CreateArticleData,
  UpdateArticleData,
} from './article.types';

export interface ArticleListResponse {
  readonly articles: ReadonlyArray<ArticleResponse>;
  readonly articlesCount: number;
}

export class ArticleService {
  public constructor(
    private readonly articles: ArticleRepositoryPort,
    private readonly now: () => number = Date.now,
  ) {}

  /** Lists articles matching filters without article bodies. */
  public async list(filters: ArticleFilters, currentUserId?: number): Promise<ArticleListResponse> {
    const [articles, articlesCount] = await this.articles.list(filters, currentUserId);
    return { articles: articles.map((article) => this.toResponse(article, false)), articlesCount };
  }

  /** Lists followed authors' articles without article bodies. */
  public async feed(userId: number, limit: number, offset: number): Promise<ArticleListResponse> {
    const [articles, articlesCount] = await this.articles.feed(userId, limit, offset);
    return { articles: articles.map((article) => this.toResponse(article, false)), articlesCount };
  }

  /** Gets one complete article. */
  public async get(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    return this.toResponse(await this.requireArticle(slug, currentUserId), true);
  }

  /** Creates an article owned by the authenticated user. */
  public async create(userId: number, input: Omit<CreateArticleData, 'slug' | 'authorId'>): Promise<ArticleResponse> {
    const article = await this.articles.create({
      ...input, authorId: userId, slug: createArticleSlug(input.title, this.now()),
    });
    return this.toResponse(article, true);
  }

  /** Updates an article when the authenticated user is its author. */
  public async update(slug: string, userId: number, input: UpdateArticleData): Promise<ArticleResponse> {
    const article = await this.requireOwnedArticle(slug, userId);
    const changes = input.title
      ? { ...input, slug: createArticleSlug(input.title, this.now()) }
      : input;
    return this.toResponse(await this.articles.update(article.id, changes, userId), true);
  }

  /** Deletes an article when the authenticated user is its author. */
  public async delete(slug: string, userId: number): Promise<void> {
    const article = await this.requireOwnedArticle(slug, userId);
    await this.articles.delete(article.id);
  }

  /** Favorites an article idempotently. */
  public async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug, userId);
    await this.articles.favorite(userId, article.id);
    return this.toResponse(await this.requireArticle(slug, userId), true);
  }

  /** Unfavorites an article idempotently. */
  public async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug, userId);
    await this.articles.unfavorite(userId, article.id);
    return this.toResponse(await this.requireArticle(slug, userId), true);
  }

  private async requireArticle(slug: string, currentUserId?: number): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug, currentUserId);
    if (!article) throw new ArticleNotFoundError(slug);
    return article;
  }

  private async requireOwnedArticle(slug: string, userId: number): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug, userId);
    if (article.authorId !== userId) throw new ArticleForbiddenError(slug);
    return article;
  }

  private toResponse(article: ArticleRecord, includeBody: boolean): ArticleResponse {
    return {
      slug: article.slug, title: article.title, description: article.description,
      ...(includeBody ? { body: article.body } : {}),
      tagList: article.tags.map(({ tag }) => tag.name),
      createdAt: article.createdAt, updatedAt: article.updatedAt,
      favorited: article.favorites.length > 0, favoritesCount: article._count.favorites,
      author: {
        username: article.author.username, bio: article.author.bio, image: article.author.image,
        following: article.author.followers.length > 0,
      },
    };
  }
}
