import { Article, Tag, User } from "@prisma/client";

import { toProfileResponse } from "../profiles/profile.dto";

export type ArticleSource = Article & {
  tags: Tag[];
  favoritedBy: Array<{ id: number }>;
  author: User & { followers: Array<{ id: number }> };
};

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: ReturnType<typeof toProfileResponse>;
}

export function toArticleResponse(
  article: ArticleSource,
  currentUserId?: number,
): ArticleResponse {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((tag) => tag.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: currentUserId
      ? article.favoritedBy.some((user) => user.id === currentUserId)
      : false,
    favoritesCount: article.favoritedBy.length,
    author: toProfileResponse(article.author, currentUserId),
  };
}
