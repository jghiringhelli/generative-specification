import {
  IArticleRepository,
  ArticleRecord,
} from '../repositories/article-repository.interface';
import { ArticleRepository } from '../repositories/article-repository';
import { IProfileRepository } from '../repositories/profile-repository.interface';
import { ProfileRepository } from '../repositories/profile-repository';
import { generateSlug } from '../utils/slug';
import {
  NotFoundError,
  ForbiddenError,
} from '../errors/http-error';
import {
  CreateArticleInput,
  UpdateArticleInput,
  PaginationQuery,
  SingleArticleDto,
  ListItemArticleDto,
  ArticleListResponseData,
} from './article-dto';

export * from './article-dto';

/**
 * Service orchestrating article publication, modification, and queries.
 */
export class ArticleService {
  private readonly articleRepo: IArticleRepository;
  private readonly profileRepo: IProfileRepository;

  /**
   * Constructs the ArticleService.
   *
   * @param {IArticleRepository} [articleRepository=new ArticleRepository()] - Injected article repo
   * @param {IProfileRepository} [profileRepository=new ProfileRepository()] - Injected profile repo
   */
  constructor(
    articleRepository: IArticleRepository = new ArticleRepository(),
    profileRepository: IProfileRepository = new ProfileRepository()
  ) {
    this.articleRepo = articleRepository;
    this.profileRepo = profileRepository;
  }

  private async buildAuthorDto(authorId: string, currentUserId?: string): Promise<ArticleAuthorDto> {
    const authorUser = await this.profileRepo.findByUsername(authorId);
    let following = false;
    if (currentUserId && authorUser) {
      following = await this.profileRepo.isFollowing(currentUserId, authorUser.id);
    }
    return {
      username: authorUser?.username ?? '',
      bio: authorUser?.bio ?? null,
      image: authorUser?.image ?? null,
      following,
    };
  }

  private async toSingleDto(article: ArticleRecord, currentUserId?: string): Promise<SingleArticleDto> {
    const following = currentUserId
      ? await this.profileRepo.isFollowing(currentUserId, article.authorId)
      : false;
    const favorited = currentUserId
      ? await this.articleRepo.isFavorited(article.id, currentUserId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((t) => t.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article.favoritesCount,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following,
      },
    };
  }

  private async toListItemDto(article: ArticleRecord, currentUserId?: string): Promise<ListItemArticleDto> {
    const following = currentUserId
      ? await this.profileRepo.isFollowing(currentUserId, article.authorId)
      : false;
    const favorited = currentUserId
      ? await this.articleRepo.isFavorited(article.id, currentUserId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags.map((t) => t.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article.favoritesCount,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following,
      },
    };
  }

  /**
   * Creates a new article.
   *
   * @param {CreateArticleInput} input - Validated input
   * @param {string} authorId - ID of authenticated creator
   * @returns {Promise<SingleArticleDto>} Created article
   */
  public async createArticle(input: CreateArticleInput, authorId: string): Promise<SingleArticleDto> {
    const { title, description, body, tagList } = input.article;
    const slug = generateSlug(title);

    const created = await this.articleRepo.create({
      slug,
      title,
      description,
      body,
      authorId,
      tagList,
    });

    return this.toSingleDto(created, authorId);
  }

  /**
   * Updates an existing article if author matches.
   *
   * @param {string} slug - Target slug
   * @param {UpdateArticleInput} input - Update fields
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<SingleArticleDto>} Updated article
   */
  public async updateArticle(
    slug: string,
    input: UpdateArticleInput,
    userId: string
  ): Promise<SingleArticleDto> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError('Article not found');
    }
    if (existing.authorId !== userId) {
      throw new ForbiddenError('You are not authorized to update this article');
    }

    const { title, description, body, tagList } = input.article;
    const newSlug = title ? generateSlug(title) : undefined;

    const updated = await this.articleRepo.update(slug, {
      slug: newSlug,
      title,
      description,
      body,
      tagList,
    });

    return this.toSingleDto(updated, userId);
  }

  /**
   * Deletes an article by slug if author matches.
   *
   * @param {string} slug - Target slug
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<void>}
   */
  public async deleteArticle(slug: string, userId: string): Promise<void> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError('Article not found');
    }
    if (existing.authorId !== userId) {
      throw new ForbiddenError('You are not authorized to delete this article');
    }

    await this.articleRepo.delete(slug);
  }

  /**
   * Retrieves an article by slug.
   *
   * @param {string} slug - Target slug
   * @param {string} [currentUserId] - Optional viewer user ID
   * @returns {Promise<SingleArticleDto>} Article
   */
  public async getArticle(slug: string, currentUserId?: string): Promise<SingleArticleDto> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    return this.toSingleDto(article, currentUserId);
  }

  /**
   * Lists articles with filters and pagination. Note: list items exclude body.
   *
   * @param {PaginationQuery} query - Filter and pagination options
   * @param {string} [currentUserId] - Optional viewer user ID
   * @returns {Promise<ArticleListResponseData>} List of articles and count
   */
  public async listArticles(
    query: PaginationQuery,
    currentUserId?: string
  ): Promise<ArticleListResponseData> {
    const result = await this.articleRepo.findMany({
      tag: query.tag,
      author: query.author,
      favorited: query.favorited,
      limit: query.limit,
      offset: query.offset,
    });

    const articles = await Promise.all(
      result.articles.map((a) => this.toListItemDto(a, currentUserId))
    );

    return {
      articles,
      articlesCount: result.totalCount,
    };
  }

  /**
   * Lists feed articles from followed authors. Excludes body.
   *
   * @param {string} userId - Authenticated user ID
   * @param {PaginationQuery} query - Pagination options
   * @returns {Promise<ArticleListResponseData>} Feed articles and count
   */
  public async getFeed(
    userId: string,
    query: PaginationQuery
  ): Promise<ArticleListResponseData> {
    const result = await this.articleRepo.findFeed(userId, {
      limit: query.limit,
      offset: query.offset,
    });

    const articles = await Promise.all(
      result.articles.map((a) => this.toListItemDto(a, userId))
    );

    return {
      articles,
      articlesCount: result.totalCount,
    };
  }

  /**
   * Favorites an article.
   *
   * @param {string} slug - Target slug
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<SingleArticleDto>} Updated article
   */
  public async favoriteArticle(slug: string, userId: string): Promise<SingleArticleDto> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    await this.articleRepo.favorite(existing.id, userId);
    const updated = await this.articleRepo.findBySlug(slug);
    return this.toSingleDto(updated!, userId);
  }

  /**
   * Unfavorites an article.
   *
   * @param {string} slug - Target slug
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<SingleArticleDto>} Updated article
   */
  public async unfavoriteArticle(slug: string, userId: string): Promise<SingleArticleDto> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    await this.articleRepo.unfavorite(existing.id, userId);
    const updated = await this.articleRepo.findBySlug(slug);
    return this.toSingleDto(updated!, userId);
  }
}
