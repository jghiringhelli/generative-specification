
/**
 * Article repository interface.
 * Defines the contract for all article data access operations.
 */

export interface IArticle {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IArticleWithMeta {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface IArticleListItem {
  slug: string;
  title: string;
  description: string;
  // Note: body is NOT included in list responses (per RealWorld spec 2024-08-16)
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface IListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface IArticleRepository {
  /**
   * Find article by unique slug.
   * @param slug - Article slug (unique identifier)
   * @param currentUserId - ID of user viewing the article (null if anonymous)
   * @returns Article with metadata if found, null otherwise
   */
  findBySlug(
    slug: string,
    currentUserId: number | null
  ): Promise<IArticleWithMeta | null>;

  /**
   * List articles with filters and pagination.
   * @param query - Filter and pagination parameters
   * @param currentUserId - ID of user viewing the list (null if anonymous)
   * @returns Articles and total count
   */
  list(
    query: IListArticlesQuery,
    currentUserId: number | null
  ): Promise<{ articles: IArticleListItem[]; articlesCount: number }>;

  /**
   * Get feed of articles from users that currentUser follows.
   * @param currentUserId - ID of user requesting feed (required)
   * @param limit - Maximum articles to return (default 20)
   * @param offset - Pagination offset (default 0)
   * @returns Articles and total count
   */
  getFeed(
    currentUserId: number,
    limit?: number,
    offset?: number
  ): Promise<{ articles: IArticleListItem[]; articlesCount: number }>;

  /**
   * Create a new article.
   * @param data - Article creation data
   * @param authorId - ID of the author
   * @returns Created article with metadata
   * @throws ConflictError if slug already exists
   */
  create(
    data: {
      slug: string;
      title: string;
      description: string;
      body: string;
      tagList: string[];
    },
    authorId: number
  ): Promise<IArticleWithMeta>;

  /**
   * Update an article by slug.
   * Only provided fields are updated (partial update).
   * If title changes, slug is regenerated.
   * @throws NotFoundError if article does not exist
   * @throws ForbiddenError if current user is not the author
   */
  update(
    slug: string,
    data: {
      title?: string;
      description?: string;
      body?: string;
    },
    currentUserId: number
  ): Promise<IArticleWithMeta>;

  /**
   * Delete an article by slug.
   * @throws NotFoundError if article does not exist
   * @throws ForbiddenError if current user is not the author
   */
  delete(slug: string, currentUserId: number): Promise<void>;

  /**
   * Favorite an article.
   * @param slug - Article slug
   * @param userId - User favoriting the article
   * @returns Updated article with metadata
   * @throws NotFoundError if article does not exist
   */
  favorite(slug: string, userId: number): Promise<IArticleWithMeta>;

  /**
   * Unfavorite an article.
   * @param slug - Article slug
   * @param userId - User unfavoriting the article
   * @returns Updated article with metadata
   * @throws NotFoundError if article does not exist
   */
  unfavorite(slug: string, userId: number): Promise<IArticleWithMeta>;

  /**
   * Check if article slug exists.
   */
  slugExists(slug: string): Promise<boolean>;
}
