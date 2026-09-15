import { Request } from 'express';

export interface AuthPayload {
  id: number;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string;
  image: string;
}

export interface ProfileResponse {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileResponse;
}

export interface CommentResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: ProfileResponse;
}
