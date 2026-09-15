import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { slugify } from "../../lib/slug";
import { UserRepository } from "../user/user.repository";
import {
  ArticleRepository,
  ArticleWithRelations,
  ListFilters,
} from "./article.repository";
import {
  CreateArticleInput,
  FeedQuery,
  ListQuery,
  UpdateArticleInput,
} from "./article.schemas";

/** A single article rendered for API responses. */
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
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

/** Response wrapping a single article. */
export interface SingleArticleResponse {
  article: ArticleView;
}

/** Response wrapping a list of articles and a count. */
export interface ArticleListResponse {
  articles: ArticleView[];
  articlesCount: number;
}

/**
 * Business logic for article creation, retrieval, listing and favoriting.
 */
export class ArticleService {
  private readonly articles: ArticleRepository;
  private readonly users: UserRepository;

  /**
   * @param articles Injected article repository.
   * @param users Injected user repository.
   */
  constructor(articles: ArticleRepository, users: UserRepository) {
    this.articles = articles;
    this.users = users;
  }

  /**
   * List articles with optional filters and pagination.
   * @param query Validated list query.
   * @param currentUserId The viewer id, when authenticated.
   * @returns The article list without body fields.
   */
  async list(
    query: ListQuery,
    currentUserId?: number,
  ): Promise<ArticleListResponse> {
    const filters: ListFilters = {
      tag: query.tag,
      author: query.author,
      favorited: query.favorited,
      limit: query.limit,
      offset: query.offset,
    };
    const [rows, articlesCount] = await Promise.all([
      this.articles.list(filters),
      this.articles.count(filters),
    ]);
    const articles = await this.viewList(rows, currentUserId, false);
    return { articles, articlesCount };
  }

  /**
   * List articles authored by followed users.
   * @param query Validated feed query.
   * @param currentUserId The authenticated viewer id.
   * @returns The feed list without body fields.
   */
  async feed(
    query: FeedQuery,
    currentUserId: number,
  ): Promise<ArticleListResponse> {
    const [rows, articlesCount] = await Promise.all([
      this.articles.feed(currentUserId, query.limit, query.offset),
      this.articles.feedCount(currentUserId),
    ]);
    const articles = await this.viewList(rows, currentUserId, false);
    return { articles, articlesCount };
  }

  /**
   * Fetch a single article by slug.
   * @param slug The article slug.
   * @param currentUserId The viewer id, when authenticated.
   * @returns The article including body.
   */
  async get(
    slug: string,
    currentUserId?: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    return { article: await this.toView(article, currentUserId, true) };
  }

  /**
   * Create a new article.
   * @param input Validated creation input.
   * @param currentUserId The author id.
   * @returns The created article.
   */
  async create(
    input: CreateArticleInput,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.articles.create({
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList ?? [],
      authorId: currentUserId,
    });
    return { article: await this.toView(article, currentUserId, true) };
  }

  /**
   * Update an article the current user owns.
   * @param slug The article slug.
   * @param input Validated update input.
   * @param currentUserId The requesting user id.
   * @returns The updated article.
   */
  async update(
    slug: string,
    input: UpdateArticleInput,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, currentUserId);
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) {
      data.title = input.title;
      data.slug = slugify(input.title);
    }
    if (input.description !== undefined) data.description = input.description;
    if (input.body !== undefined) data.body = input.body;
    if (input.tagList !== undefined) data.tagList = input.tagList;
    const updated = await this.articles.update(article.id, data);
    return { article: await this.toView(updated, currentUserId, true) };
  }

  /**
   * Delete an article the current user owns.
   * @param slug The article slug.
   * @param currentUserId The requesting user id.
   */
  async delete(slug: string, currentUserId: number): Promise<void> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, currentUserId);
    await this.articles.delete(article.id);
  }

  /**
   * Favorite an article.
   * @param slug The article slug.
   * @param currentUserId The requesting user id.
   * @returns The article with updated favorite state.
   */
  async favorite(
    slug: string,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    const updated = await this.articles.favorite(article.id, currentUserId);
    return { article: await this.toView(updated, currentUserId, true) };
  }

  /**
   * Unfavorite an article.
   * @param slug The article slug.
   * @param currentUserId The requesting user id.
   * @returns The article with updated favorite state.
   */
  async unfavorite(
    slug: string,
    currentUserId: number,
  ): Promise<SingleArticleResponse> {
    const article = await this.requireArticle(slug);
    const updated = await this.articles.unfavorite(article.id, currentUserId);
    return { article: await this.toView(updated, currentUserId, true) };
  }

  /**
   * Load an article by slug or throw a 404.
   * @param slug The article slug.
   * @returns The article with relations.
   */
  private async requireArticle(slug: string): Promise<ArticleWithRelations> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError("article not found");
    }
    return article;
  }

  /**
   * Ensure the given user authored the article or throw 403.
   * @param article The article.
   * @param userId The requesting user id.
   */
  private assertAuthor(
    article: ArticleWithRelations,
    userId: number,
  ): void {
    if (article.authorId !== userId) {
      throw new ForbiddenError("you are not the author of this article");
    }
  }

  /**
   * Map a batch of articles to views resolving following state.
   * @param rows The articles.
   * @param currentUserId The viewer id, when authenticated.
   * @param includeBody Whether to include the body field.
   * @returns The mapped article views.
   */
  private async viewList(
    rows: ArticleWithRelations[],
    currentUserId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleView[]> {
    return Promise.all(
      rows.map((row) => this.toView(row, currentUserId, includeBody)),
    );
  }

  /**
   * Map an article to its API view.
   * @param article The article with relations.
   * @param currentUserId The viewer id, when authenticated.
   * @param includeBody Whether to include the body field.
   * @returns The article view.
   */
  private async toView(
    article: ArticleWithRelations,
    currentUserId: number | undefined,
    includeBody: boolean,
  ): Promise<ArticleView> {
    const favorited = currentUserId
      ? article.favoritedBy.some((user) => user.id === currentUserId)
      : false;
    const following = currentUserId
      ? await this.users.isFollowing(currentUserId, article.authorId)
      : false;
    const view: ArticleView = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following,
      },
    };
    if (includeBody) {
      view.body = article.body;
    }
    return view;
  }
}
