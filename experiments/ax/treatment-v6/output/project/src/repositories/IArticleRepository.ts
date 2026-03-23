/** Article domain entity returned from repository operations. */
export interface Article {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tagList: ReadonlyArray<string>;
}

/** Article with author profile and aggregate data. */
export interface ArticleWithMeta extends Article {
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
  readonly favoritesCount: number;
  readonly favorited: boolean;
}

/** Filters for listing articles. */
export interface ArticleFilters {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
}

/** Data required to create a new article. */
export interface CreateArticleData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: number;
  readonly tagList: ReadonlyArray<string>;
}

/** Data for updating an existing article. */
export interface UpdateArticleData {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly tagList?: ReadonlyArray<string>;
}

/**
 * Port interface for article persistence operations.
 * Services depend on this interface; Prisma implementation is injected at composition root.
 */
export interface IArticleRepository {
  /**
   * Find all articles matching the given filters.
   * @param filters - Filter and pagination parameters.
   * @param currentUserId - Optional current user ID for following/favorited state.
   * @returns Articles with metadata and total count.
   */
  findAll(
    filters: ArticleFilters,
    currentUserId?: number,
  ): Promise<{ articles: ArticleWithMeta[]; articlesCount: number }>;

  /**
   * Find articles from authors the given user follows (feed).
   * @param userId - The following user's ID.
   * @param limit - Maximum number of articles to return.
   * @param offset - Number of articles to skip.
   * @returns Articles with metadata and total count.
   */
  findFeed(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ articles: ArticleWithMeta[]; articlesCount: number }>;

  /**
   * Find a single article by its slug.
   * @param slug - The article's URL slug.
   * @param currentUserId - Optional current user ID for following/favorited state.
   * @returns The article with metadata if found, null otherwise.
   */
  findBySlug(slug: string, currentUserId?: number): Promise<ArticleWithMeta | null>;

  /**
   * Create a new article.
   * @param data - The article creation data.
   * @returns The created article with metadata.
   */
  create(data: CreateArticleData): Promise<ArticleWithMeta>;

  /**
   * Update an existing article.
   * @param slug - The article's current URL slug.
   * @param data - The fields to update.
   * @param currentUserId - The requesting user's ID.
   * @returns The updated article with metadata.
   */
  update(slug: string, data: UpdateArticleData, currentUserId?: number): Promise<ArticleWithMeta>;

  /**
   * Delete an article by slug.
   * @param slug - The article's URL slug.
   */
  delete(slug: string): Promise<void>;

  /**
   * Add an article to a user's favorites.
   * @param slug - The article's URL slug.
   * @param userId - The user favoriting the article.
   * @returns The article with updated favorites metadata.
   */
  favorite(slug: string, userId: number): Promise<ArticleWithMeta>;

  /**
   * Remove an article from a user's favorites.
   * @param slug - The article's URL slug.
   * @param userId - The user unfavoriting the article.
   * @returns The article with updated favorites metadata.
   */
  unfavorite(slug: string, userId: number): Promise<ArticleWithMeta>;

  /**
   * Check if a user has favorited an article.
   * @param articleId - The article's primary key.
   * @param userId - The user's primary key.
   * @returns True if favorited, false otherwise.
   */
  isFavorited(articleId: number, userId: number): Promise<boolean>;

  /**
   * Get the total favorites count for an article.
   * @param articleId - The article's primary key.
   * @returns The favorites count.
   */
  getFavoritesCount(articleId: number): Promise<number>;
}
