import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { ProfileService } from './ProfileService';
import { ArticleDTO } from '../dto';
import { Article, ArticleListFilter, FeedFilter } from '../domain/types';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { slugFromTitle } from '../utils/slug';

/** Create-article input (already validated). */
export interface CreateArticleInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

/** Update-article input (already validated). */
export interface UpdateArticleInput {
  title?: string;
  description?: string;
  body?: string;
}

/** A paginated list of article views. */
export interface ArticleListDTO {
  articles: ArticleDTO[];
  articlesCount: number;
}

/**
 * Business logic for article CRUD, listing, feed, and favorites.
 */
export class ArticleService {
  private readonly articles: IArticleRepository;
  private readonly users: IUserRepository;
  private readonly profiles: ProfileService;

  /**
   * @param articles - Article repository port.
   * @param users - User repository port.
   * @param profiles - Profile service for author projection.
   */
  constructor(
    articles: IArticleRepository,
    users: IUserRepository,
    profiles: ProfileService,
  ) {
    this.articles = articles;
    this.users = users;
    this.profiles = profiles;
  }

  /**
   * List articles with filters and pagination. List views omit the body.
   * @param filter - Tag/author/favorited filters and pagination.
   * @param viewerId - Viewer id, if authenticated.
   * @returns Article views without bodies plus the total count.
   */
  async list(filter: ArticleListFilter, viewerId?: number): Promise<ArticleListDTO> {
    const result = await this.articles.list(filter);
    return this.toListDTO(result.articles, result.articlesCount, viewerId, false);
  }

  /**
   * List the personalized feed of followed authors' articles (no body).
   * @param viewerId - Authenticated viewer id.
   * @param filter - Pagination.
   * @returns Article views without bodies plus the total count.
   */
  async feed(viewerId: number, filter: FeedFilter): Promise<ArticleListDTO> {
    const result = await this.articles.feed(viewerId, filter);
    return this.toListDTO(result.articles, result.articlesCount, viewerId, false);
  }

  /**
   * Fetch a single article by slug (includes the body).
   * @param slug - Article slug.
   * @param viewerId - Viewer id, if authenticated.
   * @returns The article view.
   * @throws NotFoundError if not found.
   */
  async getBySlug(slug: string, viewerId?: number): Promise<ArticleDTO> {
    const article = await this.requireArticle(slug);
    return this.toArticleDTO(article, viewerId, true);
  }

  /**
   * Create a new article authored by the current user.
   * @param authorId - Authenticated author id.
   * @param input - Validated article fields.
   * @returns The created article view (includes body).
   */
  async create(authorId: number, input: CreateArticleInput): Promise<ArticleDTO> {
    const created = await this.articles.create({
      slug: slugFromTitle(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      authorId,
      tagList: input.tagList ?? [],
    });
    return this.toArticleDTO(created, authorId, true);
  }

  /**
   * Update an article; only its author may do so.
   * @param slug - Article slug.
   * @param userId - Authenticated user id.
   * @param input - Validated update fields.
   * @returns The updated article view (includes body).
   * @throws NotFoundError if missing; ForbiddenError if not the author.
   */
  async update(slug: string, userId: number, input: UpdateArticleInput): Promise<ArticleDTO> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, userId);
    const nextSlug = input.title ? slugFromTitle(input.title) : undefined;
    const updated = await this.articles.update(article.id, {
      title: input.title,
      description: input.description,
      body: input.body,
      slug: nextSlug,
    });
    return this.toArticleDTO(updated, userId, true);
  }

  /**
   * Delete an article; only its author may do so.
   * @param slug - Article slug.
   * @param userId - Authenticated user id.
   * @throws NotFoundError if missing; ForbiddenError if not the author.
   */
  async delete(slug: string, userId: number): Promise<void> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, userId);
    await this.articles.delete(article.id);
  }

  /**
   * Favorite an article for the current user.
   * @param slug - Article slug.
   * @param userId - Authenticated user id.
   * @returns The article view with updated favorite state.
   * @throws NotFoundError if the article is missing.
   */
  async favorite(slug: string, userId: number): Promise<ArticleDTO> {
    const article = await this.requireArticle(slug);
    await this.articles.addFavorite(userId, article.id);
    return this.toArticleDTO(article, userId, true);
  }

  /**
   * Remove the current user's favorite from an article.
   * @param slug - Article slug.
   * @param userId - Authenticated user id.
   * @returns The article view with updated favorite state.
   * @throws NotFoundError if the article is missing.
   */
  async unfavorite(slug: string, userId: number): Promise<ArticleDTO> {
    const article = await this.requireArticle(slug);
    await this.articles.removeFavorite(userId, article.id);
    return this.toArticleDTO(article, userId, true);
  }

  /**
   * Load an article by slug or throw.
   * @param slug - Article slug.
   * @returns The article.
   * @throws NotFoundError if not found.
   */
  private async requireArticle(slug: string): Promise<Article> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article;
  }

  /**
   * Assert that the given user authored the article.
   * @param article - The article.
   * @param userId - The candidate author id.
   * @throws ForbiddenError if the user is not the author.
   */
  private assertAuthor(article: Article, userId: number): void {
    if (article.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this article');
    }
  }

  /**
   * Map a list of articles to DTOs.
   * @param articles - Domain articles.
   * @param articlesCount - Total count for pagination.
   * @param viewerId - Viewer id, if any.
   * @param includeBody - Whether to include the body field.
   * @returns The list DTO.
   */
  private async toListDTO(
    articles: Article[],
    articlesCount: number,
    viewerId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleListDTO> {
    const views = await Promise.all(
      articles.map((article) => this.toArticleDTO(article, viewerId, includeBody)),
    );
    return { articles: views, articlesCount };
  }

  /**
   * Map a single article to its DTO, composing author profile and favorites.
   * @param article - Domain article.
   * @param viewerId - Viewer id, if any.
   * @param includeBody - Whether to include the body field.
   * @returns The article view.
   */
  private async toArticleDTO(
    article: Article,
    viewerId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleDTO> {
    const author = await this.users.findById(article.authorId);
    if (!author) {
      throw new NotFoundError('Article author not found');
    }
    const authorProfile = await this.profiles.buildProfile(author, viewerId);
    const favorited =
      viewerId === undefined
        ? false
        : await this.articles.isFavorited(viewerId, article.id);
    const favoritesCount = await this.articles.favoritesCount(article.id);

    const dto: ArticleDTO = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: authorProfile,
    };
    if (includeBody) {
      dto.body = article.body;
    }
    return dto;
  }
}
