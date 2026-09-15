import {
  Article,
  ArticleListFilter,
  CreateArticleInput,
  FeedFilter,
  UpdateArticleInput,
} from '../types/domain';

/** A page of articles plus the total count matching the filter. */
export interface ArticleListResult {
  articles: Article[];
  total: number;
}

/**
 * Persistence contract for articles, including favorites and feeds.
 */
export interface IArticleRepository {
  /** Persist a new article and return the created record. */
  create(input: CreateArticleInput): Promise<Article>;
  /** Find an article by its unique slug, or null if none exists. */
  findBySlug(slug: string): Promise<Article | null>;
  /** List articles matching optional filters, paginated. */
  list(filter: ArticleListFilter): Promise<ArticleListResult>;
  /** List articles authored by users the given user follows, paginated. */
  feed(userId: number, filter: FeedFilter): Promise<ArticleListResult>;
  /** Apply a partial update to an article and return the updated record. */
  update(id: number, input: UpdateArticleInput): Promise<Article>;
  /** Delete an article by primary key. */
  delete(id: number): Promise<void>;
  /** Record a favorite of an article by a user (idempotent). */
  addFavorite(userId: number, articleId: number): Promise<void>;
  /** Remove a favorite of an article by a user (idempotent). */
  removeFavorite(userId: number, articleId: number): Promise<void>;
  /** Whether the given user has favorited the given article. */
  isFavorited(userId: number, articleId: number): Promise<boolean>;
  /** Total number of users who have favorited the given article. */
  favoritesCount(articleId: number): Promise<number>;
}
