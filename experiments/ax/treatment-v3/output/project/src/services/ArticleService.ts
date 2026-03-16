import {
  IArticleRepository,
  ArticleWithRelations,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilters,
  Pagination,
  ArticleListResult
} from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '../errors/AppError';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../config/constants';

export interface CreateArticleDTO {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleDTO {
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface ArticleListResponse {
  slug: string;
  title: string;
  description: string;
  // Note: body field NOT included in list responses
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/**
 * Article service - business logic for articles, favorites, and feed.
 * Depends on IArticleRepository, IUserRepository, IProfileRepository interfaces.
 */
export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * List articles with optional filters and pagination.
   * @param filters - Optional tag, author, favorited filters
   * @param pagination - Limit and offset (defaults: 20, 0)
   * @param currentUserId - Optional current user ID for favorited/following status
   * @returns Articles list (without body field) and total count
   */
  async listArticles(
    filters: ArticleFilters = {},
    pagination: Partial<Pagination> = {},
    currentUserId?: number
  ): Promise<{ articles: ArticleListResponse[]; articlesCount: number }> {
    const limit = pagination.limit ?? DEFAULT_LIMIT;
    const offset = pagination.offset ?? DEFAULT_OFFSET;

    const result = await this.articleRepository.findMany(
      filters,
      { limit, offset },
      currentUserId
    );

    const articles = result.articles.map(this.toListResponse);

    return {
      articles,
      articlesCount: result.articlesCount
    };
  }

  /**
   * Get feed articles (from followed users).
   * @param userId - Current user ID
   * @param pagination - Limit and offset
   * @returns Articles list (without body field) and total count
   */
  async getFeed(
    userId: number,
    pagination: Partial<Pagination> = {}
  ): Promise<{ articles: ArticleListResponse[]; articlesCount: number }> {
    const limit = pagination.limit ?? DEFAULT_LIMIT;
    const offset = pagination.offset ?? DEFAULT_OFFSET;

    const result = await this.articleRepository.findFeed(userId, { limit, offset });

    const articles = result.articles.map(this.toListResponse);

    return {
      articles,
      articlesCount: result.articlesCount
    };
  }

  /**
   * Get single article by slug.
   * @param slug - Article slug
   * @param currentUserId - Optional current user ID for favorited/following status
   * @returns Full article with body field
   * @throws NotFoundError if article not found
   */
  async getArticle(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);

    if (!article) {
      throw new NotFoundError('Article');
    }

    return this.toResponse(article);
  }

  /**
   * Create a new article.
   * @param dto - Article creation data
   * @param authorId - Author user ID
   * @returns Created article
   */
  async createArticle(dto: CreateArticleDTO, authorId: number): Promise<ArticleResponse> {
    const baseSlug = generateSlug(dto.title);
    const slug = await generateUniqueSlug(
      baseSlug,
      async (s) => {
        const existing = await this.articleRepository.findBySlug(s);
        return existing !== null;
      }
    );

    const article = await this.articleRepository.create({
      slug,
      title: dto.title,
      description: dto.description,
      body: dto.body,
      authorId,
      tags: dto.tagList || []
    });

    return this.toResponse(article);
  }

  /**
   * Update an article.
   * @param slug - Article slug
   * @param dto - Article update data
   * @param userId - Current user ID (must be author)
   * @returns Updated article
   * @throws NotFoundError if article not found
   * @throws AuthorizationError if user is not author
   */
  async updateArticle(
    slug: string,
    dto: UpdateArticleDTO,
    userId: number
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    if (article.authorId !== userId) {
      throw new AuthorizationError('Only the author can update this article');
    }

    const updateData: UpdateArticleData = {
      title: dto.title,
      description: dto.description,
      body: dto.body
    };

    // If title changes, regenerate slug
    if (dto.title && dto.title !== article.title) {
      const baseSlug = generateSlug(dto.title);
      const newSlug = await generateUniqueSlug(
        baseSlug,
        async (s) => {
          const existing = await this.articleRepository.findBySlug(s);
          return existing !== null && existing.slug !== slug;
        }
      );
      updateData.slug = newSlug;
    }

    const updated = await this.articleRepository.update(slug, updateData);

    return this.toResponse(updated);
  }

  /**
   * Delete an article.
   * @param slug - Article slug
   * @param userId - Current user ID (must be author)
   * @throws NotFoundError if article not found
   * @throws AuthorizationError if user is not author
   */
  async deleteArticle(slug: string, userId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article');
    }

    if (article.authorId !== userId) {
      throw new AuthorizationError('Only the author can delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  /**
   * Favorite an article.
   * @param slug - Article slug
   * @param userId - Current user ID
   * @returns Updated article
   * @throws NotFoundError if article not found
   */
  async favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, userId);

    if (!article) {
      throw new NotFoundError('Article');
    }

    if (article.favorited) {
      throw new ValidationError('Article already favorited');
    }

    await this.articleRepository.favorite(article.id, userId);

    // Refetch to get updated counts
    const updated = await this.articleRepository.findBySlug(slug, userId);
    return this.toResponse(updated!);
  }

  /**
   * Unfavorite an article.
   * @param slug - Article slug
   * @param userId - Current user ID
   * @returns Updated article
   * @throws NotFoundError if article not found
   */
  async unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, userId);

    if (!article) {
      throw new NotFoundError('Article');
    }

    if (!article.favorited) {
      throw new ValidationError('Article not favorited');
    }

    await this.articleRepository.unfavorite(article.id, userId);

    // Refetch to get updated counts
    const updated = await this.articleRepository.findBySlug(slug, userId);
    return this.toResponse(updated!);
  }

  /**
   * Convert ArticleWithRelations to full response (includes body).
   */
  private toResponse(article: ArticleWithRelations): ArticleResponse {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: article.favorited,
      favoritesCount: article.favoritesCount,
      author: article.author
    };
  }

  /**
   * Convert ArticleWithRelations to list response (excludes body).
   */
  private toListResponse(article: ArticleWithRelations): ArticleListResponse {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      // body field intentionally omitted per RealWorld spec 2024-08-16
      tagList: article.tags,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: article.favorited,
      favoritesCount: article.favoritesCount,
      author: article.author
    };
  }
}
