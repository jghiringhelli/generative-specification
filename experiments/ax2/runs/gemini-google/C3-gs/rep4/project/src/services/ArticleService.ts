import { IArticleRepository, CreateArticleData, UpdateArticleData } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ArticleResponseDto, ArticleQueryFilters, ArticleEntity } from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/AppError';

export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  /**
   * Lists articles with optional filters and pagination without the body field.
   * @param filters - Query filters such as tag, author, favorited, limit, offset.
   * @param currentUserId - Optional id of the authenticated user.
   */
  async listArticles(
    filters: ArticleQueryFilters,
    currentUserId?: string
  ): Promise<{ articles: ArticleResponseDto[]; articlesCount: number }> {
    const { articles, articlesCount } = await this.articleRepository.findMany(filters, currentUserId);
    const dtos = await Promise.all(
      articles.map((art) => this.mapToResponseDto(art, currentUserId, false))
    );
    return { articles: dtos, articlesCount };
  }

  /**
   * Retrieves personal feed of articles from followed authors without the body field.
   * @param userId - Id of the authenticated user.
   * @param limit - Max count of articles.
   * @param offset - Offset index.
   */
  async getFeed(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ articles: ArticleResponseDto[]; articlesCount: number }> {
    const { articles, articlesCount } = await this.articleRepository.findFeed(userId, limit, offset);
    const dtos = await Promise.all(
      articles.map((art) => this.mapToResponseDto(art, userId, false))
    );
    return { articles: dtos, articlesCount };
  }

  /**
   * Retrieves a single article by its slug, including the body field.
   * @param slug - Article slug.
   * @param currentUserId - Optional id of the authenticated user.
   */
  async getArticle(slug: string, currentUserId?: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }
    return this.mapToResponseDto(article, currentUserId, true);
  }

  /**
   * Creates a new article.
   * @param authorId - Authenticated user id.
   * @param data - Article payload containing title, description, body, and tags.
   */
  async createArticle(authorId: string, data: CreateArticleData): Promise<ArticleResponseDto> {
    const errors: Record<string, string[]> = {};
    if (!data.title || !data.title.trim()) errors.title = ["can't be blank"];
    if (!data.description || !data.description.trim()) errors.description = ["can't be blank"];
    if (!data.body || !data.body.trim()) errors.body = ["can't be blank"];

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const created = await this.articleRepository.create(authorId, {
      title: data.title.trim(),
      description: data.description.trim(),
      body: data.body.trim(),
      tagList: data.tagList
    });

    return this.mapToResponseDto(created, authorId, true);
  }

  /**
   * Updates an existing article (author only).
   * @param authorId - Authenticated user id.
   * @param slug - Article slug.
   * @param data - Updated fields.
   */
  async updateArticle(
    authorId: string,
    slug: string,
    data: UpdateArticleData
  ): Promise<ArticleResponseDto> {
    const existing = await this.articleRepository.findBySlug(slug, authorId);
    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenError('Only the author can update this article');
    }

    const updated = await this.articleRepository.update(slug, data);
    return this.mapToResponseDto(updated, authorId, true);
  }

  /**
   * Deletes an article by slug (author only).
   * @param authorId - Authenticated user id.
   * @param slug - Article slug.
   */
  async deleteArticle(authorId: string, slug: string): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug, authorId);
    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenError('Only the author can delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  /**
   * Favorites an article.
   * @param userId - Authenticated user id.
   * @param slug - Article slug.
   */
  async favoriteArticle(userId: string, slug: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug, userId);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const updated = await this.articleRepository.favorite(article.id, userId);
    return this.mapToResponseDto(updated, userId, true);
  }

  /**
   * Unfavorites an article.
   * @param userId - Authenticated user id.
   * @param slug - Article slug.
   */
  async unfavoriteArticle(userId: string, slug: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug, userId);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const updated = await this.articleRepository.unfavorite(article.id, userId);
    return this.mapToResponseDto(updated, userId, true);
  }

  private async mapToResponseDto(
    article: ArticleEntity,
    currentUserId?: string,
    includeBody = true
  ): Promise<ArticleResponseDto> {
    let following = false;
    if (currentUserId && article.authorId && currentUserId !== article.authorId) {
      following = await this.profileRepository.isFollowing(currentUserId, article.authorId);
    }

    const dto: ArticleResponseDto = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags ?? [],
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: !!article.favorited,
      favoritesCount: article.favoritesCount ?? 0,
      author: {
        username: article.author?.username ?? '',
        bio: article.author?.bio ?? '',
        image: article.author?.image ?? '',
        following
      }
    };

    if (includeBody) {
      dto.body = article.body;
    }

    return dto;
  }
}
