
/**
 * Article repository port interface.
 */
export interface IArticleRepository {
  /**
   * Find article by unique slug.
   * @param slug - URL-friendly article identifier
   * @param currentUserId - Optional user ID to include favorited status
   * @returns Article with author, tags, and favorited status, or null
   */
  findBySlug(slug: string, currentUserId?: number): Promise<ArticleEntity | null>;

  /**
   * Check if slug already exists.
   * @param slug - Slug to check
   * @returns true if slug exists
   */
  slugExists(slug: string): Promise<boolean>;

  /**
   * Create a new article.
   * @param data - Article creation data
   * @returns Created article with author and tags
   */
  create(data: CreateArticleData): Promise<ArticleEntity>;

  /**
   * Update an existing article.
   * @param slug - Current article slug
   * @param data - Update data (may include new title → new slug)
   * @returns Updated article
   */
  update(slug: string, data: UpdateArticleData): Promise<ArticleEntity>;

  /**
   * Delete an article by slug.
   * @param slug - Article slug
   */
  delete(slug: string): Promise<void>;

  /**
   * List articles with filters and pagination.
   * @param filters - Optional filters (tag, author, favorited by user)
   * @param pagination - Limit and offset
   * @param currentUserId - Optional user ID for favorited status
   * @returns Articles (without body field per spec) and total count
   */
  list(
    filters: ArticleFilters,
    pagination: Pagination,
    currentUserId?: number
  ): Promise<ArticleListResult>;

  /**
   * Get feed of articles from followed users.
   * @param userId - Current user ID
   * @param pagination - Limit and offset
   * @returns Articles from followed users (without body) and total count
   */
  getFeed(userId: number, pagination: Pagination): Promise<ArticleListResult>;

  /**
   * Add article to user's favorites.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with incremented favoritesCount
   */
  favorite(slug: string, userId: number): Promise<ArticleEntity>;

  /**
   * Remove article from user's favorites.
   * @param slug - Article slug
   * @param userId - User ID
   * @returns Updated article with decremented favoritesCount
   */
  unfavorite(slug: string, userId: number): Promise<ArticleEntity>;
}

export interface ArticleEntity {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  slug: string;
  authorId: number;
  tagList: string[];
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
  slug?: string;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favoritedBy?: string;
}

export interface Pagination {
  limit: number;
  offset: number;
}

export interface ArticleListResult {
  articles: Omit<ArticleEntity, 'body'>[];
  articlesCount: number;
}
