import slugify from 'slugify';
import { z } from 'zod';
import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import {
  ArticleListResponse,
  ArticleResponse,
  ArticleView,
  toArticleListResponse,
  toArticleResponse,
  toArticleView
} from '../dto/articleView';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { parseOrThrow } from '../utils/validation';
import { ArticleEntity, UserEntity } from '../domain/types';

const createSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional()
  })
});

const updateSchema = z.object({
  article: z
    .object({
      title: z.string().min(1, "can't be blank").optional(),
      description: z.string().min(1, "can't be blank").optional(),
      body: z.string().min(1, "can't be blank").optional()
    })
    .strict()
});

/**
 * Business logic for articles: CRUD, listing, feed, and favoriting.
 */
export class ArticleService {
  /**
   * @param articleRepository - Article persistence port.
   * @param userRepository - User lookup port (for author profiles).
   * @param profileRepository - Follow relationship port.
   */
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * List articles with optional filters and pagination (no body field).
   * @param query - Raw query params (tag, author, favorited, limit, offset).
   * @param viewerId - Authenticated viewer id, if any.
   * @returns The list response.
   */
  async list(query: ArticleQuery, viewerId: number | undefined): Promise<ArticleListResponse> {
    const { limit, offset } = parsePagination(query);
    const result = await this.articleRepository.list({
      tag: emptyToUndefined(query.tag),
      author: emptyToUndefined(query.author),
      favoritedBy: emptyToUndefined(query.favorited),
      limit,
      offset
    });
    const views = await this.buildViews(result.articles, viewerId);
    return toArticleListResponse(views, result.total);
  }

  /**
   * List articles authored by users the viewer follows (no body field).
   * @param query - Raw query params (limit, offset).
   * @param viewerId - Authenticated viewer id.
   * @returns The feed list response.
   */
  async feed(query: ArticleQuery, viewerId: number): Promise<ArticleListResponse> {
    const { limit, offset } = parsePagination(query);
    const followedIds = await this.profileRepository.findFollowedIds(viewerId);
    const result = await this.articleRepository.feed(followedIds, { limit, offset });
    const views = await this.buildViews(result.articles, viewerId);
    return toArticleListResponse(views, result.total);
  }

  /**
   * Get a single article by slug (includes body).
   * @param slug - The article slug.
   * @param viewerId - Authenticated viewer id, if any.
   * @returns The article response.
   */
  async getBySlug(slug: string, viewerId: number | undefined): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    return toArticleResponse(await this.buildView(article, viewerId, true));
  }

  /**
   * Create a new article authored by the given user.
   * @param input - Raw request body.
   * @param author - The authenticated author.
   * @returns The created article response.
   */
  async create(input: unknown, author: UserEntity): Promise<ArticleResponse> {
    const { article } = parseOrThrow(createSchema, input);
    const created = await this.articleRepository.create({
      slug: await this.generateUniqueSlug(article.title),
      title: article.title,
      description: article.description,
      body: article.body,
      authorId: author.id,
      tagList: article.tagList ?? []
    });
    return toArticleResponse(await this.buildView(created, author.id, true));
  }

  /**
   * Update an article; only its author may do so.
   * @param slug - The article slug.
   * @param input - Raw request body.
   * @param user - The authenticated user.
   * @returns The updated article response.
   */
  async update(slug: string, input: unknown, user: UserEntity): Promise<ArticleResponse> {
    const { article } = parseOrThrow(updateSchema, input);
    const existing = await this.requireArticle(slug);
    this.assertAuthor(existing, user.id);
    const nextSlug = article.title ? await this.generateUniqueSlug(article.title) : undefined;
    const updated = await this.articleRepository.update(existing.id, {
      title: article.title,
      description: article.description,
      body: article.body,
      slug: nextSlug
    });
    return toArticleResponse(await this.buildView(updated, user.id, true));
  }

  /**
   * Delete an article; only its author may do so.
   * @param slug - The article slug.
   * @param user - The authenticated user.
   */
  async delete(slug: string, user: UserEntity): Promise<void> {
    const existing = await this.requireArticle(slug);
    this.assertAuthor(existing, user.id);
    await this.articleRepository.delete(existing.id);
  }

  /**
   * Favorite an article.
   * @param slug - The article slug.
   * @param userId - The authenticated user id.
   * @returns The article response with favorited = true.
   */
  async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articleRepository.addFavorite(userId, article.id);
    const refreshed = await this.requireArticle(slug);
    return toArticleResponse(await this.buildView(refreshed, userId, true));
  }

  /**
   * Remove a favorite from an article.
   * @param slug - The article slug.
   * @param userId - The authenticated user id.
   * @returns The article response with favorited = false.
   */
  async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articleRepository.removeFavorite(userId, article.id);
    const refreshed = await this.requireArticle(slug);
    return toArticleResponse(await this.buildView(refreshed, userId, true));
  }

  /**
   * Load an article by slug or throw 404.
   * @param slug - The article slug.
   * @returns The article entity.
   */
  private async requireArticle(slug: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article not found');
    }
    return article;
  }

  /**
   * Assert that the given user authored the article.
   * @param article - The article entity.
   * @param userId - The user id to check.
   */
  private assertAuthor(article: ArticleEntity, userId: number): void {
    if (article.authorId !== userId) {
      throw new ForbiddenError('you are not the author of this article');
    }
  }

  /**
   * Build a single article view resolving author, favorite, and follow state.
   * @param article - The article entity.
   * @param viewerId - Viewer id, if any.
   * @param includeBody - Whether to include the body field.
   * @returns The article view.
   */
  private async buildView(
    article: ArticleEntity,
    viewerId: number | undefined,
    includeBody: boolean
  ): Promise<ArticleView> {
    const author = await this.userRepository.findById(article.authorId);
    if (!author) {
      throw new NotFoundError('article author not found');
    }
    const favorited = viewerId
      ? await this.articleRepository.isFavorited(viewerId, article.id)
      : false;
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, author.id)
      : false;
    return toArticleView(article, { author, favorited, following, includeBody });
  }

  /**
   * Build article views for a list (body excluded).
   * @param articles - The article entities.
   * @param viewerId - Viewer id, if any.
   * @returns The article views.
   */
  private async buildViews(
    articles: ArticleEntity[],
    viewerId: number | undefined
  ): Promise<ArticleView[]> {
    return Promise.all(articles.map((article) => this.buildView(article, viewerId, false)));
  }

  /**
   * Generate a slug unique across articles by appending a suffix on collision.
   * @param title - The article title.
   * @returns A unique slug.
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true }) || 'article';
    let slug = base;
    while (await this.articleRepository.findBySlug(slug)) {
      slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    }
    return slug;
  }
}

/**
 * Raw article query parameters as received from Express.
 */
export interface ArticleQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: string;
  offset?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse and clamp pagination parameters.
 * @param query - Raw query params.
 * @returns Sanitized limit and offset.
 */
function parsePagination(query: ArticleQuery): { limit: number; offset: number } {
  const parsedLimit = Number.parseInt(query.limit ?? '', 10);
  const parsedOffset = Number.parseInt(query.offset ?? '', 10);
  const limit = Number.isNaN(parsedLimit)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(parsedLimit, 0), MAX_LIMIT);
  const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0);
  return { limit, offset };
}

/**
 * Normalize an empty string query value to undefined.
 * @param value - The raw value.
 * @returns The value, or undefined if empty.
 */
function emptyToUndefined(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}
