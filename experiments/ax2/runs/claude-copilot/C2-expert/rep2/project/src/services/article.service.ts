import {
  ArticleRepository,
  ArticleListFilters,
  ArticleWithRelations
} from '../repositories/article.repository';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { slugify } from '../utils/slug';
import { Pagination } from '../utils/pagination';
import { CreateArticleInput, UpdateArticleInput } from '../validators/article.schemas';
import { ArticleView, toArticleView } from './article.presenter';

export interface ArticleListQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  pagination: Pagination;
}

export interface ArticleListResult {
  articles: ArticleView[];
  articlesCount: number;
}

/**
 * Application service orchestrating article reads and writes.
 */
export class ArticleService {
  constructor(
    private readonly articles: ArticleRepository,
    private readonly users: UserRepository
  ) {}

  private async followingSet(viewerId?: number): Promise<ReadonlySet<number>> {
    if (!viewerId) {
      return new Set<number>();
    }
    return new Set(await this.users.followingIds(viewerId));
  }

  /**
   * Lists articles with optional filters, excluding body from list items.
   * @param query filters and pagination.
   * @param viewerId the authenticated viewer id, if any.
   * @returns articles and total count.
   */
  async list(query: ArticleListQuery, viewerId?: number): Promise<ArticleListResult> {
    const filters: ArticleListFilters = {
      tag: query.tag,
      author: query.author,
      favoritedBy: query.favorited,
      limit: query.pagination.limit,
      offset: query.pagination.offset
    };
    return this.buildList(filters, viewerId);
  }

  /**
   * Lists articles authored by users the viewer follows.
   * @param viewerId the authenticated viewer id.
   * @param pagination limit/offset.
   * @returns articles and total count.
   */
  async feed(viewerId: number, pagination: Pagination): Promise<ArticleListResult> {
    const authorIds = await this.users.followingIds(viewerId);
    const filters: ArticleListFilters = {
      authorIds,
      limit: pagination.limit,
      offset: pagination.offset
    };
    return this.buildList(filters, viewerId);
  }

  private async buildList(
    filters: ArticleListFilters,
    viewerId?: number
  ): Promise<ArticleListResult> {
    const [rows, count, following] = await Promise.all([
      this.articles.list(filters),
      this.articles.count(filters),
      this.followingSet(viewerId)
    ]);
    const articles = rows.map((article) =>
      toArticleView(article, {
        currentUserId: viewerId,
        followingAuthorIds: following,
        includeBody: false
      })
    );
    return { articles, articlesCount: count };
  }

  /**
   * Fetches a single article by slug, including its body.
   * @param slug the article slug.
   * @param viewerId the authenticated viewer id, if any.
   * @returns the article view.
   */
  async getBySlug(slug: string, viewerId?: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    return this.present(article, viewerId);
  }

  /**
   * Creates a new article authored by the given user.
   * @param input validated article fields.
   * @param authorId the authenticated author id.
   * @returns the created article view.
   */
  async create(input: CreateArticleInput, authorId: number): Promise<ArticleView> {
    const article = await this.articles.create({
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList ?? [],
      authorId
    });
    return this.present(article, authorId);
  }

  /**
   * Updates an article; only its author may do so.
   * @param slug the article slug.
   * @param input validated update fields.
   * @param userId the authenticated user id.
   * @returns the updated article view.
   */
  async update(slug: string, input: UpdateArticleInput, userId: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, userId);
    const updated = await this.articles.update(article.id, {
      ...input,
      slug: input.title ? slugify(input.title) : undefined
    });
    return this.present(updated, userId);
  }

  /**
   * Deletes an article; only its author may do so.
   * @param slug the article slug.
   * @param userId the authenticated user id.
   */
  async delete(slug: string, userId: number): Promise<void> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, userId);
    await this.articles.delete(article.id);
  }

  /**
   * Idempotently favorites an article for the viewer.
   * @param slug the article slug.
   * @param userId the authenticated user id.
   * @returns the article view with updated favorite state.
   */
  async favorite(slug: string, userId: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(userId, article.id);
    return this.present(await this.requireArticle(slug), userId);
  }

  /**
   * Idempotently unfavorites an article for the viewer.
   * @param slug the article slug.
   * @param userId the authenticated user id.
   * @returns the article view with updated favorite state.
   */
  async unfavorite(slug: string, userId: number): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(userId, article.id);
    return this.present(await this.requireArticle(slug), userId);
  }

  private async present(article: ArticleWithRelations, viewerId?: number): Promise<ArticleView> {
    const following = await this.followingSet(viewerId);
    return toArticleView(article, {
      currentUserId: viewerId,
      followingAuthorIds: following,
      includeBody: true
    });
  }

  private assertAuthor(article: ArticleWithRelations, userId: number): void {
    if (article.author.id !== userId) {
      throw new ForbiddenError('only the author may modify this article');
    }
  }

  private async requireArticle(slug: string): Promise<ArticleWithRelations> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article does not exist');
    }
    return article;
  }
}
