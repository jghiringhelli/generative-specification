import { Request } from 'express';

export interface UserResponseData {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface UserResponse {
  user: UserResponseData;
}

export interface ProfileData {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ProfileResponse {
  profile: ProfileData;
}

export interface AuthorProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleItem {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorProfile;
}

export interface ArticleListItem {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorProfile;
}

export interface ArticleResponse {
  article: ArticleItem;
}

export interface ArticlesResponse {
  articles: ArticleListItem[];
  articlesCount: number;
}

export interface CommentItem {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: AuthorProfile;
}

export interface CommentResponse {
  comment: CommentItem;
}

export interface CommentsResponse {
  comments: CommentItem[];
}

export interface TagsResponse {
  tags: string[];
}

export interface ApiErrorResponse {
  errors: {
    body: string[];
  };
}

export interface JwtPayload {
  id: number;
  email: string;
  username: string;
}

export interface RequestWithUser extends Request {
  userId?: number;
  user?: JwtPayload;
}
