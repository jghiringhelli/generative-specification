import { ForbiddenError, NotFoundError } from "../errors/application-error";
import { FollowRepositoryPort } from "../profiles/follow.repository";
import {
  ArticleFilters,
  ArticleInput,
  ArticleListItem,
  ArticleRecord,
  ArticleResponse,
  ArticleUpdate
} from "./article.types";
import { ArticleRepositoryPort } from "./article.repository";
import { generateSlug } from "./slug";

export class ArticleService {
  public constructor(
    private readonly articles: ArticleRepositoryPort,
    private readonly follows: FollowRepositoryPort
  ) {}

  /** Lists public articles without article bodies. */
  public async list(filters: ArticleFilters, currentUserId?: number) {
    const result = await this.articles.list(filters);
    return {
      articles: await Promise.all(
        result.articles.map((article) => this.toListItem(article, currentUserId))
      ),
      articlesCount: result.count
    };
  }

  /** Lists articles written by followed users without article bodies. */
  public listFeed(
    currentUserId: number,
    pagination: Pick<ArticleFilters, "limit" | "offset">
  ) {
    return this.list({ ...pagination, followedByUserId: currentUserId }, currentUserId);
  }

  /** Gets a single article with its body. */
  public async get(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    return this.toResponse(await this.requireArticle(slug), currentUserId);
  }

  /** Creates an article for the authenticated author. */
  public async create(authorId: number, input: ArticleInput): Promise<ArticleResponse> {
    const article = await this.articles.create(authorId, generateSlug(input.title), input);
    return this.toResponse(article, authorId);
  }

  /** Updates an article when the requester is its author. */
  public async update(
    slug: string,
    userId: number,
    input: ArticleUpdate
  ): Promise<ArticleResponse> {
    const article = await this.requireOwnedArticle(slug, userId);
    const nextSlug = input.title ? generateSlug(input.title) : undefined;
    return this.toResponse(await this.articles.update(article.id, nextSlug, input), userId);
  }

  /** Deletes an article when the requester is its author. */
  public async delete(slug: string, userId: number): Promise<void> {
    const article = await this.requireOwnedArticle(slug, userId);
    await this.articles.delete(article.id);
  }

  /** Idempotently favorites an article. */
  public async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(userId, article.id);
    return this.get(slug, userId);
  }

  /** Idempotently removes an article favorite. */
  public async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(userId, article.id);
    return this.get(slug, userId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("Article does not exist");
    }
    return article;
  }

  private async requireOwnedArticle(slug: string, userId: number): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) {
      throw new ForbiddenError();
    }
    return article;
  }

  private async toListItem(
    article: ArticleRecord,
    currentUserId?: number
  ): Promise<ArticleListItem> {
    const following = currentUserId
      ? await this.follows.isFollowing(currentUserId, article.authorId)
      : false;
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags.map((tag) => tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: currentUserId
        ? article.favorites.some((favorite) => favorite.userId === currentUserId)
        : false,
      favoritesCount: article._count.favorites,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  private async toResponse(
    article: ArticleRecord,
    currentUserId?: number
  ): Promise<ArticleResponse> {
    return { ...(await this.toListItem(article, currentUserId)), body: article.body };
  }
}
