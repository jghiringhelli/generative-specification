/**
 * Article repository port interface.
 * Defines data access contract for Article entity.
 */
export interface IArticleRepository {
  /**
   * Find article by slug.
   * @param slug - Article slug (unique, URL-friendly identifier)
   * @returns Article with author and tags, or null if not found
   */
  findBySlug(slug: string): Promise<ArticleWithRelations | null>;

  /**
   * Create a new article.
   * @param data - Article creation data
   * @returns Created article with relations
   */
  create(data: CreateArticleData): Promise<ArticleWithRelations>;

  /**
   * Update an existing article.
   * @param slug - Article slug
   * @param data - Partial article update data
   * @returns Updated article with relations
   */
  update(slug: string, data: UpdateArticleData): Promise<ArticleWithRelations>;

  /**
   * Delete an article.
   * @param slug - Article slug
   */
  delete(slug: string): Promise<void>;

  /**
   * List articles with filters and pagination.
   * @param filters - Query filters (tag, author, favorited)
   * @param pagination - Limit and offset
   * @returns Articles array and total count
   */
  findMany(filters: ArticleFilters, pagination: Pagination): Promise<ArticleListResult>;

  /**
   * Get feed articles for a user (from followed authors).
   * @param userId - Current user ID
   * @param pagination - Limit and offset
   * @returns Articles array and total count
   */
  findFeed(userId: number, pagination: Pagination): Promise<ArticleListResult>;
}

export interface ArticleWithRelations {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
  };
  tags: string[];
  favorited: boolean;
  favoritesCount: number;
}

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tags: string[];
}

export interface UpdateArticleData {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
}

export interface Pagination {
  limit: number;
  offset: number;
}

export interface ArticleListResult {
  articles: ArticleWithRelations[];
  articlesCount: number;
}
