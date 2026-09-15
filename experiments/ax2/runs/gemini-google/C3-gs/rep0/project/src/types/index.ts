export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  bio: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface AuthorProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorProfile;
}

export interface ArticleListItem {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorProfile;
}

export interface Comment {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorProfile;
}

export interface ArticleFilterOptions {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}
