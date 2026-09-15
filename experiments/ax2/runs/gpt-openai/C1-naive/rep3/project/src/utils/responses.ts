import { Prisma, User } from '@prisma/client';
import { createToken } from './jwt';

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

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: { include: { followers: true } };
    tags: { include: { tag: true } };
    favorites: true;
  };
}>;

export function formatUser(user: User, token?: string): UserResponse {
  return {
    email: user.email,
    token: token ?? createToken(user.id),
    username: user.username,
    bio: user.bio,
    image: user.image,
  };
}

export function formatProfile(user: User, following: boolean): ProfileResponse {
  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following,
  };
}

export function formatArticle(article: ArticleWithRelations, currentUserId?: number) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map(({ tag }) => tag.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited: currentUserId
      ? article.favorites.some((favorite) => favorite.userId === currentUserId)
      : false,
    favoritesCount: article.favorites.length,
    author: formatProfile(
      article.author,
      currentUserId
        ? article.author.followers.some((follow) => follow.followerId === currentUserId)
        : false,
    ),
  };
}
