/**
 * Shared domain entity and value-object types used across repository ports
 * and services. These are plain data contracts with no behavior and no
 * framework or persistence coupling.
 */

/**
 * A persisted user entity, including the password hash. The hash is never
 * exposed beyond the service layer.
 */
export interface UserEntity {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fields required to create a new user.
 */
export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

/**
 * Partial fields that may be updated on a user. `passwordHash` is set when the
 * caller supplies a new password.
 */
export interface UpdateUserInput {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string | null;
  image?: string | null;
}

/**
 * A persisted article entity with its author id and tag list.
 */
export interface ArticleEntity {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList: string[];
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fields required to create a new article.
 */
export interface CreateArticleInput {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList: string[];
}

/**
 * Partial fields that may be updated on an article.
 */
export interface UpdateArticleInput {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

/**
 * Filters and pagination for listing articles.
 */
export interface ArticleListFilter {
  tag?: string;
  author?: string;
  favoritedBy?: string;
  limit: number;
  offset: number;
}

/**
 * Pagination for the personalized feed.
 */
export interface FeedFilter {
  limit: number;
  offset: number;
}

/**
 * A persisted comment entity.
 */
export interface CommentEntity {
  id: number;
  body: string;
  articleId: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fields required to create a comment.
 */
export interface CreateCommentInput {
  body: string;
  articleId: number;
  authorId: number;
}
