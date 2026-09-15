import { Article, Favorite, Tag, User } from "@prisma/client";
import { prisma } from "./prisma";
import { serializeProfile } from "./serializers";

export type ArticleWithRelations = Article & {
  author: User;
  tags: Tag[];
  favorites: Favorite[];
};

export const articleInclude = {
  author: true,
  tags: true,
  favorites: true,
} as const;

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function serializeArticle(article: ArticleWithRelations, userId?: number) {
  const following = userId
    ? Boolean(
        await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: article.authorId,
            },
          },
        }),
      )
    : false;

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((tag) => tag.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.favorites.some((favorite) => favorite.userId === userId),
    favoritesCount: article.favorites.length,
    author: serializeProfile(article.author, following),
  };
}
