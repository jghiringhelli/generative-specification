import {
  ArticleListFilter,
  ArticleListResult,
  ArticleWithAuthor,
  CreateArticleData,
  FeedFilter,
  UpdateArticleData,
} from '../domain/entities';

/**
 * Persistence port for article aggregates including favorites.
 */
export interface IArticleRepository {
  /** Persist a new article with its tags and return it with the author. */
  create(data: CreateArticleData): Promise<ArticleWithAuthor>;

  /** Find an article by unique slug joined with its author, or null. */
  findBySlug(slug: string): Promise<ArticleWithAuthor | null>;

  /** Apply a partial update to an article and return it with the author. */
  update(id: string, data: UpdateArticleData): Promise<ArticleWithAuthor>;

  /** Delete an article by id. */
  delete(id: string): Promise<void>;

  /** List articles with optional tag/author/favorited filters and pagination. */
  list(filter: ArticleListFilter): Promise<ArticleListResult>;

  /** List articles authored by users the given user follows, paginated. */
  feed(filter: FeedFilter): Promise<ArticleListResult>;

  /** Record a favorite edge from user to article (idempotent). */
  favorite(userId: string, articleId: string): Promise<void>;

  /** Remove a favorite edge from user to article (idempotent). */
  unfavorite(userId: string, articleId: string): Promise<void>;

  /** True when the user has favorited the article. */
  isFavorited(userId: string, articleId: string): Promise<boolean>;

  /** Current favorites count for an article. */
  favoritesCount(articleId: string): Promise<number>;
}
