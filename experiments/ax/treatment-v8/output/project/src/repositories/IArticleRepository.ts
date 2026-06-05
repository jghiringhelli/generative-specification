/**
 * Port: persistence boundary for Article entities, including favorites.
 *
 * Concrete adapters are injected at the composition root. The adapter stays
 * ignorant of users and the follow graph: author identity and favoriters are
 * referenced by id, and the service resolves usernames → ids before querying.
 * Resolving ids to view models (author profile, viewer `favorited` flag) is a
 * service-layer concern.
 *
 * @gs-links: docs/specs/articles.md
 */

/** A persisted, non-deleted article in domain terms. */
export interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
  readonly authorId: string;
  readonly favoritesCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Fields required to create an article (slug derived by the service). */
export interface NewArticle {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
  readonly authorId: string;
}

/** Partial mutation set; the service re-derives the slug when title changes. */
export interface ArticleUpdate {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  /** Replace the whole tag set; an empty array clears all tags. */
  readonly tagList?: ReadonlyArray<string>;
}

/**
 * Filter/pagination for the global article list. Filters are pre-resolved to
 * ids by the service; an absent filter is omitted (matches everything).
 */
export interface ArticleListQuery {
  readonly tag?: string;
  readonly authorId?: string;
  readonly favoritedByUserId?: string;
  readonly limit: number;
  readonly offset: number;
}

/**
 * Pagination for the personalized feed. The service resolves the viewer's
 * followed authors to ids and passes them here, so the adapter never touches
 * the follow graph. An empty `authorIds` yields an empty page.
 */
export interface FeedQuery {
  readonly authorIds: ReadonlyArray<string>;
  readonly limit: number;
  readonly offset: number;
}

/** A page of articles plus the total count matching the query (pre-pagination). */
export interface ArticlePage {
  readonly articles: ReadonlyArray<Article>;
  readonly total: number;
}

export interface IArticleRepository {
  create(input: NewArticle): Promise<Article>;
  findBySlug(slug: string): Promise<Article | null>;
  list(query: ArticleListQuery): Promise<ArticlePage>;
  feed(query: FeedQuery): Promise<ArticlePage>;
  update(slug: string, changes: ArticleUpdate): Promise<Article>;
  /** Soft-delete by slug (operation-classification Tier 3: no hard delete). */
  delete(slug: string): Promise<void>;
  addFavorite(articleId: string, userId: string): Promise<Article>;
  removeFavorite(articleId: string, userId: string): Promise<Article>;
  isFavorited(articleId: string, userId: string): Promise<boolean>;
  /**
   * Distinct tags appearing on any non-deleted article, for `GET /api/tags`.
   * Tags are stored with the article aggregate, so the vocabulary is derived
   * from live articles (no separate tag store) — a soft-deleted article's
   * otherwise-unused tags therefore drop out.
   */
  listTags(): Promise<ReadonlyArray<string>>;
}
