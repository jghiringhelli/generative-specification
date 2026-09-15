import { NotFoundError, AppError } from "../errors";
import { createSlug } from "./slug";
import {
  ArticleListQuery,
  CreateArticleInput,
  UpdateArticleInput
} from "./article.schemas";
import { ArticleRecord, IArticleRepository } from "./article.repository";

export interface ArticleResponse {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body?: string;
  readonly tagList: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

export class ArticleService {
  public constructor(private readonly articles: IArticleRepository) {}

  public async list(query: ArticleListQuery, viewerId?: number): Promise<{ articles: ArticleResponse[]; articlesCount: number }> {
    const [articles, articlesCount] = await this.articles.list(query);
    return { articles: articles.map((article) => this.toResponse(article, viewerId, false)), articlesCount };
  }

  public async feed(query: ArticleListQuery, userId: number): Promise<{ articles: ArticleResponse[]; articlesCount: number }> {
    const [articles, articlesCount] = await this.articles.list(query, userId);
    return { articles: articles.map((article) => this.toResponse(article, userId, false)), articlesCount };
  }

  public async get(slug: string, viewerId?: number): Promise<ArticleResponse> {
    return this.toResponse(await this.find(slug), viewerId, true);
  }

  public async create(input: CreateArticleInput, authorId: number): Promise<ArticleResponse> {
    const article = await this.articles.create(authorId, createSlug(input.title), input);
    return this.toResponse(article, authorId, true);
  }

  public async update(slug: string, input: UpdateArticleInput, userId: number): Promise<ArticleResponse> {
    const article = await this.findOwned(slug, userId);
    const nextSlug = input.title ? createSlug(input.title) : undefined;
    return this.toResponse(await this.articles.update(article.id, nextSlug, input), userId, true);
  }

  public async delete(slug: string, userId: number): Promise<void> {
    await this.articles.delete((await this.findOwned(slug, userId)).id);
  }

  public async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.find(slug);
    await this.articles.favorite(userId, article.id);
    return this.get(slug, userId);
  }

  public async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.find(slug);
    await this.articles.unfavorite(userId, article.id);
    return this.get(slug, userId);
  }

  private async find(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) throw new NotFoundError("Article not found");
    return article;
  }

  private async findOwned(slug: string, userId: number): Promise<ArticleRecord> {
    const article = await this.find(slug);
    if (article.authorId !== userId) throw new AppError("Forbidden", 403);
    return article;
  }

  private toResponse(article: ArticleRecord, viewerId: number | undefined, includeBody: boolean): ArticleResponse {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      ...(includeBody && { body: article.body }),
      tagList: article.tags.map((tag) => tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: article.favorites.some((favorite) => favorite.userId === viewerId),
      favoritesCount: article.favorites.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: article.author.followers.some((follow) => follow.followerId === viewerId)
      }
    };
  }
}
