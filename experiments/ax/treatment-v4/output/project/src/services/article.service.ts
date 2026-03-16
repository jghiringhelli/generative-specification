import { IArticleRepository, ArticleFilters, Pagination } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError, AuthorizationError } from '../errors/AppError';
import { generateSlug, makeSlugUnique } from '../utils/slug';

// Constants per CLAUDE.md (no hardcoded values)
const DEFAULT_ARTICLES_LIMIT = 20;
const DEFAULT_ARTICLES_OFFSET = 0;
const MAX_ARTICLES_LIMIT = 100;

export interface CreateArticleDto {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleDto {
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface ArticleListResponse {
  slug: string;
  title: string;
  description: string;
  // Note: body field omitted per 2024-08-16 spec change
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface ListArticlesResult {
  articles: ArticleListResponse[];
  articlesCount: number;
}

/**
 * Article service.
 * Handles article CRUD, favorites, and feed operations.
 */
export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * List articles with optional filters and pagination.
   * @param filters - Optional tag, author, favorited filters
   * @param limit - Maximum articles to return
   * @param offset - Number of articles to skip
   * @param currentUserId - Optional current user ID for favorited/following status
   * @returns Paginated list of articles (without body field)
   */
  async listArticles(
    filters: ArticleFilters,
    limit: number = DEFAULT_ARTICLES_LIMIT,
    offset: number = DEFAULT_ARTICLES_OFFSET,
    currentUserId?: number
  ): Promise<ListArticlesResult> {
    const sanitizedLimit = Math.min(limit, MAX_ARTICLES_LIMIT);
    const pagination: Pagination = { limit: sanitizedLimit, offset };

    return await this.articleRepository.list(filters, pagination, currentUserId);
  }

  /**
   * Get feed of articles from followed users.
   * @param userId - Current user ID
   * @param limit - Maximum articles to return
   * @param offset - Number of articles to skip
   * @returns Paginated list of articles (without body field)
   */
  async getFeed(
    userId: number,
    limit: number = DEFAULT_ARTICLES_LIMIT,
    offset: number = DEFAULT_ARTICLES_OFFSET
  ): Promise<ListArticlesResult> {
    const sanitizedLimit = Math.min(limit, MAX_ARTICLES_LIMIT);
    const pagination: Pagination = { limit: sanitizedLimit, offset };

    return await this.articleRepository.getFeed(userId, pagination);
  }

  /**
   * Get single article by slug.
   * @param slug - Article slug
   * @param currentUserId - Optional current user ID for favorited/following status
   * @returns Article with full details including body
   * @throws NotFoundError if article not found
   */
  async getArticle(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    return article;
  }

  /**
   * Create a new article.
   * @param dto - Article data
   * @param authorId - Author user ID
   * @returns Created article
   */
  async createArticle(dto: CreateArticleDto, authorId: number): Promise<ArticleResponse> {
    // Generate unique slug
    let slug = generateSlug(dto.title);
    const slugExists = await this.articleRepository.slugExists(slug);
    
    if (slugExists) {
      slug = makeSlugUnique(slug);
    }

    const article = await this.articleRepository.create({
      title: dto.title,
      description: dto.description,
      body: dto.body,
      slug,
      authorId,
      tagList: dto.tagList || []
    });

    return article;
  }

  /**
   * Update an existing article.
   * @param slug - Current article slug
   * @param dto - Update data
   * @param currentUserId - Current user ID
   * @returns Updated article
   * @throws NotFoundError if article not found
   * @throws AuthorizationError if user is not the author
   */
  async updateArticle(
    slug: string,
    dto: UpdateArticleDto,
    currentUserId: number
  ): Promise<ArticleResponse> {
    const existing = await this.articleRepository.findBySlug(slug);

    if (!existing) {
      throw new NotFoundError('Article', slug);
    }

    // Authorization check: only author can update
    if (existing.author.username !== (await this.userRepository.findById(currentUserId))?.username) {
      throw new AuthorizationError('Only the author can update this article');
    }

    // If title changed, generate new slug
    let newSlug = slug;
    if (dto.title && dto.title !== existing.title) {
      newSlug = generateSlug(dto.title);
      const slugExists = await this.articleRepository.slugExists(newSlug);
      
      if (slugExists) {
        newSlug = makeSlugUnique(newSlug);
      }
    }

    const updated = await this.articleRepository.update(slug, {
      title: dto.title,
      description: dto.description,
      body: dto.body,
      slug: newSlug !== slug ? newSlug : undefined
    });

    return updated;
  }

  /**
   * Delete an article.
   * @param slug - Article slug
   * @param currentUserId - Current user ID
   * @throws NotFoundError if article not found
   * @throws AuthorizationError if user is not the author
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug);

    if (!existing) {
      throw new NotFoundError('Article', slug);
    }

    // Authorization check: only author can delete
    const currentUser = await this.userRepository.findById(currentUserId);
    if (existing.author.username !== currentUser?.username) {
      throw new AuthorizationError('Only the author can delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  /**
   * Favorite an article.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with favorited = true
   * @throws NotFoundError if article not found
   */
  async favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const exists = await this.articleRepository.findBySlug(slug);
    if (!exists) {
      throw new NotFoundError('Article', slug);
    }

    return await this.articleRepository.favorite(slug, userId);
  }

  /**
   * Unfavorite an article.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with favorited = false
   * @throws NotFoundError if article not found
   */
  async unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const exists = await this.articleRepository.findBySlug(slug);
    if (!exists) {
      throw new NotFoundError('Article', slug);
    }

    return await this.articleRepository.unfavorite(slug, userId);
  }
}
