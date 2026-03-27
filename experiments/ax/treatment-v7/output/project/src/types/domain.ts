/**
 * Core domain entities and value objects for the Conduit RealWorld API.
 * Pure data types — no I/O, no framework imports, no Prisma types.
 * These are the inner hexagon: all other layers depend inward on these.
 */

// =============================================================================
// Domain Entities
// =============================================================================

/** Persisted user entity as returned from the repository layer. */
export interface User {
  id: number;
  email: string;
  username: string;
  /** Argon2 password hash — never log, never expose via API response. */
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Public profile view of a user — no credentials exposed. */
export interface UserProfile {
  username: string;
  bio: string | null;
  image: string | null;
  /** Whether the requesting user follows this profile. False if no authenticated user. */
  following: boolean;
}

/** Article entity as returned from the repository layer. */
export interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  author: UserProfile;
  tagList: string[];
  favoritesCount: number;
  /** Whether the requesting user has favorited this article. False if no authenticated user. */
  favorited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Comment entity as returned from the repository layer. */
export interface Comment {
  id: number;
  body: string;
  authorId: number;
  author: UserProfile;
  articleId: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Input DTOs (repository layer inputs — not HTTP request bodies)
// =============================================================================

/** Data required to create a new user. */
export interface CreateUserData {
  email: string;
  username: string;
  /** Must be a pre-hashed argon2 hash. Never pass plaintext passwords to repositories. */
  passwordHash: string;
}

/**
 * Fields that may be updated on an existing user. All optional.
 * Empty string for bio/image must be coerced to null before this DTO is constructed.
 */
export interface UpdateUserData {
  email?: string;
  username?: string;
  /** Must be a pre-hashed argon2 hash if provided. */
  passwordHash?: string;
  /** Null represents "cleared". Empty string must be coerced to null before reaching here. */
  bio?: string | null;
  /** Null represents "cleared". Empty string must be coerced to null before reaching here. */
  image?: string | null;
}

/** Data required to create a new article. */
export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

/** Fields that may be updated on an existing article. All optional. */
export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

// =============================================================================
// Query Parameters
// =============================================================================

/** Optional filters for the article list endpoint. */
export interface ArticleFilters {
  tag?: string;
  /** Filter by author username. */
  author?: string;
  /** Filter by the username of a user who favorited the article. */
  favorited?: string;
}

/** Standard pagination parameters for list endpoints. */
export interface Pagination {
  /** Maximum number of records to return. */
  limit: number;
  /** Number of records to skip. */
  offset: number;
}

// =============================================================================
// Result Shapes
// =============================================================================

/** Result shape for paginated article queries. */
export interface PaginatedArticles {
  articles: Article[];
  /** Total count of matching articles (before pagination) — for client-side paging. */
  articlesCount: number;
}
