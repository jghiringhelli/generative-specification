import { ArticleRepository, ArticleWithRelations } from './article.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { CreateArticleInput, UpdateArticleInput } from './article.schemas';
import { generateSlug } from '../../lib/slug';
import { Pagination } from '../../lib/pagination';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

/** Author sub-document embedded in an article response. */
export interface AuthorView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/** Single article view (RealWorld shape). `body` is omitted from list items. */
export interface ArticleView {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorView;
}

/** Envelope for a single article. */
export interface ArticleResponse {
  article: ArticleView;
}

/** Envelope for a list of articles with count. */
export interface ArticleListResponse {
  articles: ArticleView[];
  articlesCount: number;
}

/** Filters accepted by the list endpoint. */
export interface ListParams extends Pagination {
  tag?: string;
  author?: string;
  favorited?: string;
}

/**
 * Business logic for article CRUD, listing, feed and favouriting.
 */
export class ArticleService {
  /**
   * @param articleRepository injected article persistence port
   * @param profileRepository injected profile/following persistence port
   */
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly profileRepository: ProfileRepository
  ) {}

  /**
   * Lists articles matching filters.
   * @param params filters plus pagination
   * @param viewerId the authenticated viewer id, if any
   * @returns the list response (list items omit `body`)
   */
  async list(params: ListParams, viewerId?: number): Promise<ArticleListResponse> {
    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.list(params),
      this.articleRepository.count(params)
    ]);
    return {
      articles: await this.viewList(articles, viewerId),
      articlesCount
    };
  }

  /**
   * Lists feed articles from followed authors.
   * @param viewerId the authenticated viewer id
   * @param pagination page size and offset
   * @returns the feed list response (list items omit `body`)
   */
  async feed(viewerId: number, pagination: Pagination): Promise<ArticleListResponse> {
    const authorIds = await this.profileRepository.getFollowingIds(viewerId);
    const [articles, articlesCount] = await Promise.all([
      this.articleRepository.listFeed(authorIds, pagination.limit, pagination.offset),
      this.articleRepository.countFeed(authorIds)
    ]);
    return {
      articles: await this.viewList(articles, viewerId),
      articlesCount
    };
  }

  /**
   * Retrieves a single article by slug.
   * @param slug the article slug
   * @param viewerId the authenticated viewer id, if any
   * @returns the article response
   * @throws NotFoundError when the slug does not exist
   */
  async getBySlug(slug: string, viewerId?: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    return { article: await this.toView(article, viewerId, true) };
  }

  /**
   * Creates a new article authored by the viewer.
   * @param input validated article fields
   * @param authorId the authenticated author id
   * @returns the created article response
   */
  async create(input: CreateArticleInput, authorId: number): Promise<ArticleResponse> {
    const article = await this.articleRepository.create({
      slug: generateSlug(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList ?? [],
      authorId
    });
    return { article: await this.toView(article, authorId, true) };
  }

  /**
   * Updates an article; only its author may do so.
   * @param slug the article slug
   * @param input validated mutable fields
   * @param viewerId the authenticated viewer id
   * @returns the updated article response
   * @throws NotFoundError when missing; ForbiddenError when not the author
   */
  async update(
    slug: string,
    input: UpdateArticleInput,
    viewerId: number
  ): Promise<ArticleResponse> {
    const article = await this.requireOwnedArticle(slug, viewerId);
    const data: Record<string, unknown> = { ...input };
    if (input.title) {
      data.slug = generateSlug(input.title);
    }
    const updated = await this.articleRepository.update(article.id, data);
    return { article: await this.toView(updated, viewerId, true) };
  }

  /**
   * Deletes an article; only its author may do so.
   * @param slug the article slug
   * @param viewerId the authenticated viewer id
   * @throws NotFoundError when missing; ForbiddenError when not the author
   */
  async delete(slug: string, viewerId: number): Promise<void> {
    const article = await this.requireOwnedArticle(slug, viewerId);
    await this.articleRepository.delete(article.id);
  }

  /**
   * Favourites an article for the viewer (idempotent).
   * @param slug the article slug
   * @param viewerId the authenticated viewer id
   * @returns the article response with updated favourite state
   */
  async favorite(slug: string, viewerId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articleRepository.favorite(viewerId, article.id);
    const refreshed = await this.requireArticle(slug);
    return { article: await this.toView(refreshed, viewerId, true) };
  }

  /**
   * Un-favourites an article for the viewer (idempotent).
   * @param slug the article slug
   * @param viewerId the authenticated viewer id
   * @returns the article response with updated favourite state
   */
  async unfavorite(slug: string, viewerId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articleRepository.unfavorite(viewerId, article.id);
    const refreshed = await this.requireArticle(slug);
    return { article: await this.toView(refreshed, viewerId, true) };
  }

  /**
   * Loads an article or throws.
   * @param slug the article slug
   * @returns the article with relations
   * @throws NotFoundError when the slug does not exist
   */
  private async requireArticle(slug: string): Promise<ArticleWithRelations> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article;
  }

  /**
   * Loads an article and asserts the viewer is its author.
   * @param slug the article slug
   * @param viewerId the authenticated viewer id
   * @returns the owned article with relations
   * @throws NotFoundError when missing; ForbiddenError when not the author
   */
  private async requireOwnedArticle(
    slug: string,
    viewerId: number
  ): Promise<ArticleWithRelations> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== viewerId) {
      throw new ForbiddenError('You are not the author of this article');
    }
    return article;
  }

  /**
   * Maps a list of articles to views (list items omit `body`).
   * @param articles articles with relations
   * @param viewerId the authenticated viewer id, if any
   * @returns list of article views
   */
  private async viewList(
    articles: ArticleWithRelations[],
    viewerId?: number
  ): Promise<ArticleView[]> {
    return Promise.all(articles.map((article) => this.toView(article, viewerId, false)));
  }

  /**
   * Maps an article entity to its response view.
   * @param article the article with relations
   * @param viewerId the authenticated viewer id, if any
   * @param includeBody whether to include the `body` field
   * @returns the article view DTO
   */
  private async toView(
    article: ArticleWithRelations,
    viewerId: number | undefined,
    includeBody: boolean
  ): Promise<ArticleView> {
    const favorited = viewerId
      ? article.favorites.some((favorite) => favorite.userId === viewerId)
      : false;
    const following = viewerId
      ? await this.profileRepository.isFollowing(viewerId, article.authorId)
      : false;
    const view: ArticleView = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favorites,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
    if (includeBody) {
      view.body = article.body;
    }
    return view;
  }
}
