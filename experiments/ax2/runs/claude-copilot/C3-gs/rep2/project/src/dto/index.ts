/**
 * Response DTOs (view models) shaped for the RealWorld API consumer. These are
 * distinct from domain entities and never expose the password hash.
 */

/** Authenticated user view including the JWT. */
export interface UserDTO {
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  token: string;
}

/** Public profile view relative to the current viewer. */
export interface ProfileDTO {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/** Article view including author profile and favorite state. */
export interface ArticleDTO {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileDTO;
}

/** Comment view including its author profile. */
export interface CommentDTO {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: ProfileDTO;
}
