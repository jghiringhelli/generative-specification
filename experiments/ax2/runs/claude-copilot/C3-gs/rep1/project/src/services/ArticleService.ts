import slugify from 'slugify';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import {
  ArticleListFilter,
  ArticleWithRelations,
  IArticleRepository,
} from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ArticleView, toArticleView } from '../dtos/articleView';
import { validate } from '../validation/validate';
import {
  createArticleSchema,
  updateArticleSchema,
} from '../validation/articleSchemas';

/**
 * A page of articles with the total match count.
 */
export interface ArticleListResult {
  articles: ArticleView[];
  articlesCount: number;
}

/**
 * Application service for article CRUD, listing, feed, and favoriting.
 */
export class ArticleService {
  private readonly articleRepository: IArticleRepository;
  private readonly profileRepository: IProfileRepository;

  /**
   * @param articleRepository - Article persistence port.
   * @param profileRepository - Follow-relationship persistence port.
   */
  constructor(
    articleRepository: IArticleRepository,
    profileRepository: IProfileRepository,
  ) {
    this.articleRepository = articleRepository;
    this.profileRepository = profileRepository;
  }

  /**
   * List articles matching filters.
   * @param filter - Tag/author/favorited filters and pagination.
   * @param viewerId - Authenticated viewer id, if any.
   * @returns Article page without bodies.
   */
  async list(filter: ArticleListFilter, viewerId?: number): Promise<ArticleListResult> {
    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.list(filter),
      this.articleRepository.count(filter),
    ]);
    const views = await this.buildViews(articles, viewerId, false);
    return { articles: views, articlesCount };
  }

  /**
   * List the personalized feed for a user.
   * @param viewerId - Authenticated viewer id.
   * @param limit - Page size.
   * @param offset - Page offset.
   * @returns Feed page without bodies.
   */
  async feed(viewerId: number, limit: number, offset: number): Promise<ArticleListResult> {
    const followedIds = await this.profileRepository.findFollowingIds(viewerId);
    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.feed(followedIds, limit, offset),
      this.articleRepository.countFeed(followedIds),
    ]);
    const views = await this.buildViews(articles, viewerId, false);
    return { articles: views, articlesCount };
  }

  /**
   * Get a single article by slug.
   * @param slug - Article slug.
   * @param viewerId - Authenticated viewer id, if any.
   * @returns The article view with body.
   */
  async get(slug: string, viewerId?: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    return this.buildView(article, viewerId, true);
  }

  /**
   * Create a new article.
   * @param authorId - Authenticated author id.
   * @param input - Raw create payload.
   * @returns The created article view with body.
   */
  async create(authorId: number, input: unknown): Promise<ArticleView> {
    const { article } = validate(createArticleSchema, input);
    const tagList = article.tagList ?? [];
    const created = await this.articleRepository.create({
      slug: this.buildSlug(article.title),
      title: article.title,
      description: article.description,
      body: article.body,
      authorId,
      tagList,
    });
    return this.buildView(created, authorId, true);
  }

  /**
   * Update an article owned by the author.
   * @param slug - Article slug.
   * @param authorId - Authenticated author id.
   * @param input - Raw update payload.
   * @returns The updated article view with body.
   */
  async update(slug: string, authorId: number, input: unknown): Promise<ArticleView> {
    const article = await this.requireOwnedArticle(slug, authorId);
    const { article: changes } = validate(updateArticleSchema, input);
    const nextSlug = changes.title ? this.buildSlug(changes.title) : undefined;
    const updated = await this.articleRepository.update(article.id, {
      title: changes.title,
      description: changes.description,
      body: changes.body,
      slug: nextSlug,
    });
    return this.buildView(updated, authorId, true);
  }

  /**
   * Delete an article owned by the author.
   * @param slug - Article slug.
   * @param authorId - Authenticated author id.
   */
  async delete(slug: string, authorId: number): Promise<void> {
    const article = await this.requireOwnedArticle(slug, authorId);
    await this.articleRepository.delete(article.id);
  }

  /**
   * Favorite an article.
   * @param slug - Article slug.
   * @param userId - Authenticated user id.
   * @returns The article view with body.
   */
  async favorite(slug: string, userId: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articleRepository.addFavorite(userId, article.id);
    return this.buildView(article, userId, true);
  }

  /**
   * Unfavorite an article.
   * @param slug - Article slug.
   * @param userId - Authenticated user id.
   * @returns The article view with body.
   */
  async unfavorite(slug: string, userId: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articleRepository.removeFavorite(userId, article.id);
    return this.buildView(article, userId, true);
  }

  /**
   * Resolve an article by slug or throw NotFoundError.
   * @param slug - Article slug.
   * @returns The article with relations.
   */
  private async requireArticle(slug: string): Promise<ArticleWithRelations> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article;
  }

  /**
   * Resolve an article by slug and assert the caller is its author.
   * @param slug - Article slug.
   * @param authorId - Authenticated author id.
   * @returns The owned article with relations.
   */
  private async requireOwnedArticle(
    slug: string,
    authorId: number,
  ): Promise<ArticleWithRelations> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== authorId) {
      throw new ForbiddenError('You are not the author of this article');
    }
    return article;
  }

  /**
   * Build a view for one article, resolving favorite and follow state.
   * @param article - Article with relations.
   * @param viewerId - Viewer id, if authenticated.
   * @param includeBody - Whether to include the body field.
   * @returns The article view.
   */
  private async buildView(
    article: ArticleWithRelations,
    viewerId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleView> {
    const [favoritesCount, favorited, following] = await Promise.all([
      this.articleRepository.favoritesCount(article.id),
      viewerId ? this.articleRepository.isFavorited(viewerId, article.id) : Promise.resolve(false),
      viewerId
        ? this.profileRepository.isFollowing(viewerId, article.authorId)
        : Promise.resolve(false),
    ]);
    return toArticleView(article, { favorited, favoritesCount, following, includeBody });
  }

  /**
   * Build views for many articles.
   * @param articles - Articles with relations.
   * @param viewerId - Viewer id, if authenticated.
   * @param includeBody - Whether to include body fields.
   * @returns Article views.
   */
  private async buildViews(
    articles: ArticleWithRelations[],
    viewerId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleView[]> {
    return Promise.all(articles.map((article) => this.buildView(article, viewerId, includeBody)));
  }

  /**
   * Generate a unique, url-safe slug from a title.
   * @param title - Article title.
   * @returns A slug string.
   */
  private buildSlug(title: string): string {
    const base = slugify(title, { lower: true, strict: true });
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }
}
