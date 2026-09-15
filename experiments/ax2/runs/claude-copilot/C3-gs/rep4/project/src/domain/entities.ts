/**
 * Domain entities and data contracts shared across ports and adapters.
 * These are plain data shapes with no framework or persistence concerns.
 */

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  bio?: string | null;
  image?: string | null;
}

export interface ProfileView {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleEntity {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: string;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleWithAuthor extends ArticleEntity {
  author: UserEntity;
}

export interface CreateArticleData {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: string;
}

export interface UpdateArticleData {
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
  userId: string;
  limit: number;
  offset: number;
}

export interface ArticleListResult {
  articles: ArticleWithAuthor[];
  articlesCount: number;
}

export interface CommentEntity {
  id: number;
  body: string;
  articleId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithAuthor extends CommentEntity {
  author: UserEntity;
}

export interface CreateCommentData {
  body: string;
  articleId: string;
  authorId: string;
}
