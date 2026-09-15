import prisma from '../prisma';
import { isFollowing, toProfile } from './profile';

export const articleInclude = {
  author: true,
  tags: true,
  favorites: true,
  _count: { select: { favorites: true } },
};

interface ArticleWithRelations {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: { username: string; bio: string | null; image: string | null; id: number };
  tags: { name: string }[];
  favorites: { userId: number }[];
  _count: { favorites: number };
}

export async function toArticle(
  article: ArticleWithRelations,
  currentUserId?: number
) {
  const following = await isFollowing(currentUserId, article.author.id);
  const favorited = currentUserId
    ? article.favorites.some((f) => f.userId === currentUserId)
    : false;
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((t) => t.name).sort(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount: article._count.favorites,
    author: toProfile(article.author, following),
  };
}
