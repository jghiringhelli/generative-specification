import { ForbiddenError, NotFoundError } from "../errors";
import { ArticleRepositoryPort } from "./article.repository";
import { createSlug } from "./slug";
import {
  ArticleFilters,
  ArticleListItem,
  ArticleRecord,
  ArticleResponse,
  CreateArticleData,
  UpdateArticleData
} from "./article.types";

export class ArticleService {
  public constructor(private readonly articles: ArticleRepositoryPort) {}

  /** Lists articles without their body fields. */
  public async list(filters: ArticleFilters, userId?: number) {
    const [records, articlesCount] = await this.articles.list(filters);
    return { articles: await this.toList(records, userId), articlesCount };
  }

  /** Lists followed authors' articles without their body fields. */
  public async feed(filters: ArticleFilters, userId: number) {
    const [records, articlesCount] = await this.articles.feed(userId, filters);
    return { articles: await this.toList(records, userId), articlesCount };
  }

  /** Returns a single article. */
  public async get(slug: string, userId?: number): Promise<ArticleResponse> {
    return this.toResponse(await this.requireArticle(slug), userId);
  }

  /** Creates an article owned by the current user. */
  public async create(data: CreateArticleData, userId: number): Promise<ArticleResponse> {
    return this.toResponse(await this.articles.create(userId, createSlug(data.title), data), userId);
  }

  /** Updates an article when the current user is its author. */
  public async update(slug: string, data: UpdateArticleData, userId: number): Promise<ArticleResponse> {
    const article = await this.requireOwnedArticle(slug, userId);
    const nextSlug = data.title ? createSlug(data.title) : undefined;
    return this.toResponse(await this.articles.update(article.id, nextSlug, data), userId);
  }

  /** Deletes an article when the current user is its author. */
  public async delete(slug: string, userId: number): Promise<void> {
    await this.articles.delete((await this.requireOwnedArticle(slug, userId)).id);
  }

  /** Favorites an article for the current user. */
  public async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(userId, article.id);
    return this.toResponse(await this.requireArticle(slug), userId);
  }

  /** Unfavorites an article for the current user. */
  public async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(userId, article.id);
    return this.toResponse(await this.requireArticle(slug), userId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) throw new NotFoundError("Article not found");
    return article;
  }

  private async requireOwnedArticle(slug: string, userId: number): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) throw new ForbiddenError();
    return article;
  }

  private async toList(records: ReadonlyArray<ArticleRecord>, userId?: number): Promise<ArticleListItem[]> {
    return Promise.all(records.map(async (record) => {
      const { body: _body, ...item } = await this.toResponse(record, userId);
      return item;
    }));
  }

  private async toResponse(article: ArticleRecord, userId?: number): Promise<ArticleResponse> {
    const following = userId === undefined ? false : await this.articles.isFollowing(userId, article.authorId);
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map(({ name }) => name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: userId !== undefined && article.favorites.some((favorite) => favorite.userId === userId),
      favoritesCount: article.favorites.length,
      author: { username: article.author.username, bio: article.author.bio, image: article.author.image, following }
    };
  }
}
