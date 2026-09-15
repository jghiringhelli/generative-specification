/**
 * Response DTOs shaped for the RealWorld API consumer.
 * These are the exact JSON contracts returned by the API layer.
 */

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
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
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
  author: ProfileResponse['profile'];
}

export interface ArticleResponse {
  article: ArticleView;
}

export interface ArticlesResponse {
  articles: ArticleView[];
  articlesCount: number;
}

export interface CommentView {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: ProfileResponse['profile'];
}

export interface CommentResponse {
  comment: CommentView;
}

export interface CommentsResponse {
  comments: CommentView[];
}

export interface TagsResponse {
  tags: string[];
}
