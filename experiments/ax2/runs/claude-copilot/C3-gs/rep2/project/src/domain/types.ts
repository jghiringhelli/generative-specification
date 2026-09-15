/**
 * Domain entity and value-object types shared across services and repositories.
 * These are plain data contracts — no behavior, no framework dependencies.
 */

/** A persisted user aggregate. */
export interface User {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields required to create a new user. */
export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

/** Mutable fields on an existing user. */
export interface UpdateUserInput {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string | null;
  image?: string | null;
}

/** A public profile view of a user relative to a viewer. */
export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/** A persisted article aggregate. */
export interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  tagList: string[];
}

/** Fields required to create an article. */
export interface CreateArticleInput {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList: string[];
}

/** Mutable fields on an existing article. */
export interface UpdateArticleInput {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

/** Filters and pagination for listing articles. */
export interface ArticleListFilter {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

/** Pagination for the personalized feed. */
export interface FeedFilter {
  limit: number;
  offset: number;
}

/** A persisted comment. */
export interface Comment {
  id: number;
  body: string;
  articleId: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields required to create a comment. */
export interface CreateCommentInput {
  body: string;
  articleId: number;
  authorId: number;
}
