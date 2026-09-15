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

export interface UserResponseDto {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface ProfileResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: UserEntity;
  tags?: string[];
  favoritesCount?: number;
  favorited?: boolean;
}

export interface ArticleResponseDto {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileResponseDto;
}

export interface CommentEntity {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  authorId: string;
  author?: UserEntity;
}

export interface CommentResponseDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: ProfileResponseDto;
}

export interface ArticleQueryFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}
