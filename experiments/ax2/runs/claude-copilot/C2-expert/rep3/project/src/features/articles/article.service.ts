import {
  ArticleRepository,
  ArticleWithRelations,
  UpdateArticleData,
} from './article.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { serializeArticle, ArticleDto } from './article.serializer';
import { generateSlug } from '../../utils/slug';
import { resolvePagination } from '../../utils/pagination';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateArticleInput, UpdateArticleInput } from './article.validation';

/** Response envelope for a single article. */
export interface SingleArticleResponse {
  article: ArticleDto;
}

/** Response envelope for a list of articles. */
export interface ArticleListResponse {
  articles: ArticleDto[];
  articlesCount: number;
}

/** Raw query values for listing articles. */
export interface ListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: unknown;
  offset?: unknown;
}

/**
 * Business logic for article listing, retrieval, authoring, and favoriting.
 */
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  /**
   * Lists articles with optional filters; list items exclude the body.
   * @param query raw filter and pagination query values
   * @param currentUserId the authenticated user id, if any
   * @returns the article list response
   */
  async listArticles(
    query: ListArticlesQuery,
    currentUserId?: number,
  ): Promise<ArticleListResponse> {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const filter = {
      tag: query.tag,
      author: query.author,
      favorited: query.favorited,
      limit,
      offset,
    };
    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.list(filter),
      this.articleRepository.count(filter),
    ]);
    const dtos = await this.serializeMany(articles, currentUserId, false);
    return { articles: dtos, articlesCount };
  }

  /**
   * Lists articles from authors the user follows; items exclude the body.
   * @param currentUserId the authenticated user id
   * @param rawLimit raw limit query value
   * @param rawOffset raw offset query value
   * @returns the feed article list response
   */
  async getFeed(
    currentUserId: number,
    rawLimit: unknown,
    rawOffset: unknown,
  ): Promise<ArticleListResponse> {
    const { limit, offset } = resolvePagination(rawLimit, rawOffset);
    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.feed(currentUserId, limit, offset),
      this.articleRepository.feedCount(currentUserId),
    ]);
    const dtos = await this.serializeMany(articles, currentUserId, false);
    return { articles: dtos, articlesCount };
  }

  /**
   * Retrieves a single article by slug (includes body).
   * @param slug the article slug
   * @param currentUserId the authenticated user id, if any
   * @returns the single article response
   * @throws NotFoundError when the article does not exist
   */
  async getArticle(
    slug: string,
    currentUserId?: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    return { article: await this.serializeOne(article, currentUserId, true) };
  }

  /**
   * Creates a new article authored by the current user.
   * @param input validated article creation data
   * @param currentUserId the authenticated author id
   * @returns the created single article response
   */
  async createArticle(
    input: CreateArticleInput,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.articleRepository.create({
      slug: generateSlug(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList ?? [],
      authorId: currentUserId,
    });
    return { article: await this.serializeOne(article, currentUserId, true) };
  }

  /**
   * Updates an article the current user authored.
   * @param slug the article slug
   * @param input validated update fields
   * @param currentUserId the authenticated user id
   * @returns the updated single article response
   * @throws NotFoundError when the article does not exist
   * @throws ForbiddenError when the user is not the author
   */
  async updateArticle(
    slug: string,
    input: UpdateArticleInput,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, currentUserId);
    const data: UpdateArticleData = {
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList,
    };
    if (input.title) {
      data.slug = generateSlug(input.title);
    }
    const updated = await this.articleRepository.update(article.id, data);
    return { article: await this.serializeOne(updated, currentUserId, true) };
  }

  /**
   * Deletes an article the current user authored.
   * @param slug the article slug
   * @param currentUserId the authenticated user id
   * @throws NotFoundError when the article does not exist
   * @throws ForbiddenError when the user is not the author
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, currentUserId);
    await this.articleRepository.delete(article.id);
  }

  /**
   * Favorites an article idempotently.
   * @param slug the article slug
   * @param currentUserId the authenticated user id
   * @returns the updated single article response
   * @throws NotFoundError when the article does not exist
   */
  async favoriteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    const updated = await this.articleRepository.favorite(
      article.id,
      currentUserId,
    );
    return { article: await this.serializeOne(updated, currentUserId, true) };
  }

  /**
   * Unfavorites an article idempotently.
   * @param slug the article slug
   * @param currentUserId the authenticated user id
   * @returns the updated single article response
   * @throws NotFoundError when the article does not exist
   */
  async unfavoriteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    const updated = await this.articleRepository.unfavorite(
      article.id,
      currentUserId,
    );
    return { article: await this.serializeOne(updated, currentUserId, true) };
  }

  /**
   * Loads an article by slug or throws.
   * @param slug the article slug
   * @returns the article with relations
   * @throws NotFoundError when the article does not exist
   */
  private async requireArticle(slug: string): Promise<ArticleWithRelations> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article not found');
    }
    return article;
  }

  /**
   * Ensures the given user authored the article.
   * @param article the article with relations
   * @param currentUserId the user id to check
   * @throws ForbiddenError when the user is not the author
   */
  private assertAuthor(
    article: ArticleWithRelations,
    currentUserId: number,
  ): void {
    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('you are not the author of this article');
    }
  }

  /**
   * Serializes a single article, resolving the author's following state.
   * @param article the article with relations
   * @param currentUserId the viewer id, if any
   * @param includeBody whether to include the body
   * @returns the serialized article DTO
   */
  private async serializeOne(
    article: ArticleWithRelations,
    currentUserId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleDto> {
    const following = await this.resolveFollowing(
      currentUserId,
      article.authorId,
    );
    return serializeArticle(article, {
      currentUserId,
      following,
      includeBody,
    });
  }

  /**
   * Serializes many articles.
   * @param articles the articles with relations
   * @param currentUserId the viewer id, if any
   * @param includeBody whether to include the body
   * @returns the serialized article DTOs
   */
  private async serializeMany(
    articles: ArticleWithRelations[],
    currentUserId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleDto[]> {
    return Promise.all(
      articles.map((article) =>
        this.serializeOne(article, currentUserId, includeBody),
      ),
    );
  }

  /**
   * Resolves whether the viewer follows the given author.
   * @param currentUserId the viewer id, if any
   * @param authorId the author id
   * @returns true when the viewer follows the author
   */
  private async resolveFollowing(
    currentUserId: number | undefined,
    authorId: number,
  ): Promise<boolean> {
    if (!currentUserId) {
      return false;
    }
    return this.profileRepository.isFollowing(currentUserId, authorId);
  }
}
