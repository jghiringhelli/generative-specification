import {
  ArticleWithAuthor,
  CommentWithAuthor,
  ProfileView,
  UserEntity,
} from '../domain/entities';

export interface UserResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export interface ProfileResponse {
  profile: ProfileView;
}

export interface ArticleResponse {
  article: ArticleView;
}

export interface ArticleView {
  slug: string;
  title: string;
  description: string;
  body?: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileView;
}

export interface CommentResponse {
  comment: CommentView;
}

export interface CommentView {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: ProfileView;
}

/** Build the authenticated user envelope including a fresh token. */
export function toUserResponse(user: UserEntity, token: string): UserResponse {
  return {
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
}

/** Build a public profile view for a user. */
export function toProfileView(user: UserEntity, following: boolean): ProfileView {
  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following,
  };
}

/** Build a single-article view; omit the body for list responses. */
export function toArticleView(
  article: ArticleWithAuthor,
  following: boolean,
  favorited: boolean,
  includeBody = true,
): ArticleView {
  const view: ArticleView = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tagList,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount: article.favoritesCount,
    author: toProfileView(article.author, following),
  };
  if (includeBody) {
    view.body = article.body;
  }
  return view;
}

/** Build a comment view. */
export function toCommentView(comment: CommentWithAuthor, following: boolean): CommentView {
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: toProfileView(comment.author, following),
  };
}
