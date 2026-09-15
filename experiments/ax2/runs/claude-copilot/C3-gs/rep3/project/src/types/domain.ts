/**
 * Domain model and DTO types shared across layers.
 *
 * These are plain data contracts — no behavior, no framework decorators.
 */

export interface User {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  bio?: string | null;
  image?: string | null;
  passwordHash?: string;
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

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

export interface CreateArticleInput {
  slug: string;
  title: string;
  description: string;
  body: string;
  authorId: number;
  tagList: string[];
}

export interface UpdateArticleInput {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
}

export interface ArticleListFilter {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

export interface FeedFilter {
  limit: number;
  offset: number;
}

export interface Comment {
  id: number;
  body: string;
  articleId: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  body: string;
  articleId: number;
  authorId: number;
}
