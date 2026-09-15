export interface ArticleAuthor {
  readonly id: string;
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
}

export interface ArticleRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly authorId: string;
  readonly author: ArticleAuthor;
  readonly tags: readonly { readonly name: string }[];
  readonly favoritesCount: number;
}

export interface CreateArticleData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly authorId: string;
  readonly tagList?: readonly string[];
}

export interface UpdateArticleData {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly tagList?: readonly string[];
}

export interface ArticleFilterOptions {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface PaginationOptions {
  readonly limit: number;
  readonly offset: number;
}

export interface ArticleQueryResult {
  readonly articles: readonly ArticleRecord[];
  readonly totalCount: number;
}

/**
 * Persistence contract for article management, queries, and favorites.
 */
export interface IArticleRepository {
  /**
   * Creates a new article with tags.
   *
   * @param {CreateArticleData} data - Article creation parameters
   * @returns {Promise<ArticleRecord>} Created article
   */
  create(data: CreateArticleData): Promise<ArticleRecord>;

  /**
   * Updates an existing article.
   *
   * @param {string} slug - Article slug
   * @param {UpdateArticleData} data - Article update fields
   * @returns {Promise<ArticleRecord>} Updated article
   */
  update(slug: string, data: UpdateArticleData): Promise<ArticleRecord>;

  /**
   * Deletes an article by slug.
   *
   * @param {string} slug - Article slug
   * @returns {Promise<void>}
   */
  delete(slug: string): Promise<void>;

  /**
   * Finds an article by slug.
   *
   * @param {string} slug - Article slug
   * @returns {Promise<ArticleRecord | null>} Article or null
   */
  findBySlug(slug: string): Promise<ArticleRecord | null>;

  /**
   * Finds articles by query filters with pagination.
   *
   * @param {ArticleFilterOptions} filters - Filtering and pagination options
   * @returns {Promise<ArticleQueryResult>} Matching articles and total count
   */
  findMany(filters: ArticleFilterOptions): Promise<ArticleQueryResult>;

  /**
   * Finds feed articles authored by users that followerId follows.
   *
   * @param {string} followerId - Follower user ID
   * @param {PaginationOptions} pagination - Pagination limit and offset
   * @returns {Promise<ArticleQueryResult>} Feed articles and count
   */
  findFeed(followerId: string, pagination: PaginationOptions): Promise<ArticleQueryResult>;

  /**
   * Adds article to user's favorites (idempotent).
   *
   * @param {string} articleId - Article ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  favorite(articleId: string, userId: string): Promise<void>;

  /**
   * Removes article from user's favorites (idempotent).
   *
   * @param {string} articleId - Article ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  unfavorite(articleId: string, userId: string): Promise<void>;

  /**
   * Checks if user has favorited this article.
   *
   * @param {string} articleId - Article ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if favorited
   */
  isFavorited(articleId: string, userId: string): Promise<boolean>;
}
