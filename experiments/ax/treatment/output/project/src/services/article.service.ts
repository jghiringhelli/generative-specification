import { IArticleRepository, ArticleWithRelations } from '../repositories/article.repository';
import { ITagRepository } from '../repositories/tag.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import {
  ArticleResponse,
  ArticleListItem,
  MultipleArticlesResponse,
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleQueryFilters
} from '../types/article.types';
import { NotFoundError, ValidationError } from '../errors';
import { AuthorizationError } from '../errors/AuthorizationError';
import { DEFAULT_LIMIT, DEFAULT_OFFSET, MAX_LIMIT } from '../config/constants';

/**
 * Article service.
 * Handles article CRUD, favorites, and feed.
 */
export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly tagRepository: ITagRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Create a new article.
   * Generates unique slug from title.
   */
  async createArticle(
    dto: CreateArticleDTO,
    authorId: number
  ): Promise<ArticleResponse> {
    const slug = await this.generateUniqueSlug(dto.title);

    const tags = dto.tagList && dto.tagList.length > 0
      ? await this.tagRepository.upsertMany(dto.tagList)
      : [];

    const article = await this.articleRepository.create({
      slug,
      title: dto.title,
      description: dto.description,
      body: dto.body,
      authorId,
      tagIds: tags.map((t) => t.id)
    });

    return this.buildArticleResponse(article, authorId);
  }

  /**
   * Get article by slug.
   */
  async getArticle(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    return this.buildArticleResponse(article, currentUserId);
  }

  /**
   * List articles with filters and pagination.
   */
  async listArticles(
    filters: ArticleQueryFilters,
    currentUserId?: number
  ): Promise<MultipleArticlesResponse> {
    const limit = this.validateLimit(filters.limit);
    const offset = this.validateOffset(filters.offset);

    const articles = await this.articleRepository.findAll({
      ...filters,
      limit,
      offset
    });

    const articleItems = await Promise.all(
      articles.map((article) => this.buildArticleListItem(article, currentUserId))
    );

    return {
      articles: articleItems,
      articlesCount: articleItems.length
    };
  }

  /**
   * Get feed of articles from followed users.
   */
  async getFeed(
    userId: number,
    limit?: number,
    offset?: number
  ): Promise<MultipleArticlesResponse> {
    const validLimit = this.validateLimit(limit);
    const validOffset = this.validateOffset(offset);

    const articles = await this.articleRepository.findFeed(
      userId,
      validLimit,
      validOffset
    );

    const articleItems = await Promise.all(
      articles.map((article) => this.buildArticleListItem(article, userId))
    );

    return {
      articles: articleItems,
      articlesCount: articleItems.length
    };
  }

  /**
   * Update article.
   * Only author can update.
   */
  async updateArticle(
    slug: string,
    dto: UpdateArticleDTO,
    currentUserId: number
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    if (article.authorId !== currentUserId) {
      throw new AuthorizationError('Only the author can update this article');
    }

    let newSlug: string | undefined;

    if (dto.title && dto.title !== article.title) {
      newSlug = await this.generateUniqueSlug(dto.title);
    }

    const updatedArticle = await this.articleRepository.update(slug, {
      ...dto,
      newSlug
    });

    return this.buildArticleResponse(updatedArticle, currentUserId);
  }

  /**
   * Delete article.
   * Only author can delete.
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    if (article.authorId !== currentUserId) {
      throw new AuthorizationError('Only the author can delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  /**
   * Favorite an article.
   * Idempotent.
   */
  async favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    await this.articleRepository.favorite(userId, article.id);

    const updatedArticle = await this.articleRepository.findBySlug(slug);
    return this.buildArticleResponse(updatedArticle!, userId);
  }

  /**
   * Unfavorite an article.
   * Idempotent.
   */
  async unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    await this.articleRepository.unfavorite(userId, article.id);

    const updatedArticle = await this.articleRepository.findBySlug(slug);
    return this.buildArticleResponse(updatedArticle!, userId);
  }

  /**
   * Generate unique slug from title.
   * Format: lowercase, hyphen-separated.
   * Appends counter if slug exists.
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    let slug = baseSlug;
    let counter = 2;

    while (await this.articleRepository.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Build full article response with author profile.
   */
  private async buildArticleResponse(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleResponse> {
    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, article.author.id)
      : false;

    const favorited = currentUserId
      ? article.favoritedBy.some((f) => f.userId === currentUserId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((t) => t.tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  /**
   * Build article list item (no body field).
   */
  private async buildArticleListItem(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleListItem> {
    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, article.author.id)
      : false;

    const favorited = currentUserId
      ? article.favoritedBy.some((f) => f.userId === currentUserId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags.map((t) => t.tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  private validateLimit(limit?: number): number {
    if (limit === undefined) return DEFAULT_LIMIT;
    if (limit < 1) return DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) return MAX_LIMIT;
    return limit;
  }

  private validateOffset(offset?: number): number {
    if (offset === undefined) return DEFAULT_OFFSET;
    if (offset < 0) return DEFAULT_OFFSET;
    return offset;
  }
}
