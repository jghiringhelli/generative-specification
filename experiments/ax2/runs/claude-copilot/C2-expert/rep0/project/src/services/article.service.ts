import { z } from 'zod';
import {
  ArticleRepository,
  type ArticleWithRelations,
  type ListArticlesFilter
} from '../repositories/article.repository';
import { UserRepository } from '../repositories/user.repository';
import { FollowRepository } from '../repositories/follow.repository';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { generateSlug } from '../utils/slug';
import { parsePagination } from '../utils/pagination';
import { parseOrThrow } from '../utils/validation';
import { ForbiddenError, NotFoundError } from '../errors';

const createSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'title is required'),
    description: z.string().min(1, 'description is required'),
    body: z.string().min(1, 'body is required'),
    tagList: z.array(z.string()).optional()
  })
});

const updateSchema = z.object({
  article: z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      tagList: z.array(z.string()).optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required'
    })
});

/** Author sub-view embedded in article responses. */
export interface ArticleAuthorView {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/** Full article view including body. */
export interface ArticleView {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ArticleAuthorView;
}

/** Article list view omitting `body` per the 2024-08-16 spec change. */
export type ArticleListItemView = Omit<ArticleView, 'body'>;

/** Raw query parameters for listing articles. */
export interface ListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: unknown;
  offset?: unknown;
}

/**
 * Application service implementing article CRUD, listing, feed and favoriting.
 */
export class ArticleService {
  private readonly articleRepository: ArticleRepository;
  private readonly userRepository: UserRepository;
  private readonly followRepository: FollowRepository;
  private readonly favoriteRepository: FavoriteRepository;

  constructor(
    articleRepository: ArticleRepository,
    userRepository: UserRepository,
    followRepository: FollowRepository,
    favoriteRepository: FavoriteRepository
  ) {
    this.articleRepository = articleRepository;
    this.userRepository = userRepository;
    this.followRepository = followRepository;
    this.favoriteRepository = favoriteRepository;
  }

  /**
   * Lists articles matching optional filters with pagination.
   * @param query The raw query parameters.
   * @param currentUserId The viewing user's id, if authenticated.
   * @returns The list items and total count.
   */
  async listArticles(
    query: ListArticlesQuery,
    currentUserId?: number
  ): Promise<{ articles: ArticleListItemView[]; articlesCount: number }> {
    const pagination = parsePagination(query.limit, query.offset);
    const filter: ListArticlesFilter = {
      tag: query.tag,
      author: query.author,
      favorited: query.favorited,
      limit: pagination.limit,
      offset: pagination.offset
    };
    const { articles, count } = await this.articleRepository.list(filter);
    const views = await Promise.all(
      articles.map((article) => this.toListItem(article, currentUserId))
    );
    return { articles: views, articlesCount: count };
  }

  /**
   * Lists articles authored by users the current user follows.
   * @param query The raw query parameters (pagination only).
   * @param currentUserId The authenticated user's id.
   * @returns The feed list items and total count.
   */
  async getFeed(
    query: ListArticlesQuery,
    currentUserId: number
  ): Promise<{ articles: ArticleListItemView[]; articlesCount: number }> {
    const pagination = parsePagination(query.limit, query.offset);
    const authorIds =
      await this.followRepository.findFollowingIds(currentUserId);
    const { articles, count } = await this.articleRepository.list({
      authorIds,
      limit: pagination.limit,
      offset: pagination.offset
    });
    const views = await Promise.all(
      articles.map((article) => this.toListItem(article, currentUserId))
    );
    return { articles: views, articlesCount: count };
  }

  /**
   * Fetches a single article by slug.
   * @param slug The article slug.
   * @param currentUserId The viewing user's id, if authenticated.
   * @returns The full article view.
   * @throws {NotFoundError} When no article has the slug.
   */
  async getArticle(
    slug: string,
    currentUserId?: number
  ): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    return this.toView(article, currentUserId);
  }

  /**
   * Creates a new article authored by the current user.
   * @param payload The raw request body.
   * @param currentUserId The authenticated author's id.
   * @returns The created article view.
   */
  async createArticle(
    payload: unknown,
    currentUserId: number
  ): Promise<ArticleView> {
    const { article } = parseOrThrow(createSchema, payload);
    const created = await this.articleRepository.create({
      slug: generateSlug(article.title),
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList ?? [],
      authorId: currentUserId
    });
    return this.toView(created, currentUserId);
  }

  /**
   * Updates an article owned by the current user.
   * @param slug The article slug.
   * @param payload The raw request body.
   * @param currentUserId The authenticated user's id.
   * @returns The updated article view.
   * @throws {NotFoundError} When the article does not exist.
   * @throws {ForbiddenError} When the user is not the author.
   */
  async updateArticle(
    slug: string,
    payload: unknown,
    currentUserId: number
  ): Promise<ArticleView> {
    const { article } = parseOrThrow(updateSchema, payload);
    const existing = await this.requireArticle(slug);
    this.assertAuthor(existing, currentUserId);
    const data: Record<string, unknown> = { ...article };
    if (article.title !== undefined) {
      data.slug = generateSlug(article.title);
    }
    const updated = await this.articleRepository.update(existing.id, data);
    return this.toView(updated, currentUserId);
  }

  /**
   * Deletes an article owned by the current user.
   * @param slug The article slug.
   * @param currentUserId The authenticated user's id.
   * @throws {NotFoundError} When the article does not exist.
   * @throws {ForbiddenError} When the user is not the author.
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const existing = await this.requireArticle(slug);
    this.assertAuthor(existing, currentUserId);
    await this.articleRepository.delete(existing.id);
  }

  /**
   * Marks an article as favorited by the current user (idempotent).
   * @param slug The article slug.
   * @param currentUserId The authenticated user's id.
   * @returns The updated article view.
   */
  async favoriteArticle(
    slug: string,
    currentUserId: number
  ): Promise<ArticleView> {
    const existing = await this.requireArticle(slug);
    await this.favoriteRepository.favorite(currentUserId, existing.id);
    const refreshed = await this.requireArticle(slug);
    return this.toView(refreshed, currentUserId);
  }

  /**
   * Removes the current user's favorite from an article (idempotent).
   * @param slug The article slug.
   * @param currentUserId The authenticated user's id.
   * @returns The updated article view.
   */
  async unfavoriteArticle(
    slug: string,
    currentUserId: number
  ): Promise<ArticleView> {
    const existing = await this.requireArticle(slug);
    await this.favoriteRepository.unfavorite(currentUserId, existing.id);
    const refreshed = await this.requireArticle(slug);
    return this.toView(refreshed, currentUserId);
  }

  private async requireArticle(slug: string): Promise<ArticleWithRelations> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article does not exist');
    }
    return article;
  }

  private assertAuthor(
    article: ArticleWithRelations,
    currentUserId: number
  ): void {
    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('you are not the author of this article');
    }
  }

  private async toView(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleView> {
    const author = await this.buildAuthorView(article, currentUserId);
    const favorited =
      currentUserId !== undefined
        ? article.favorites.some((fav) => fav.userId === currentUserId)
        : false;
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited,
      favoritesCount: article._count.favorites,
      author
    };
  }

  private async toListItem(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleListItemView> {
    const { body, ...listItem } = await this.toView(article, currentUserId);
    void body;
    return listItem;
  }

  private async buildAuthorView(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleAuthorView> {
    const following =
      currentUserId !== undefined
        ? await this.followRepository.isFollowing(
            currentUserId,
            article.authorId
          )
        : false;
    return {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following
    };
  }
}
