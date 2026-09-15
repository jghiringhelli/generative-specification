import prisma from '../prisma';

export interface ArticleJson {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
}

export const articleInclude = {
  author: true,
  tags: true,
  favoritedBy: { select: { id: true } },
  _count: { select: { favoritedBy: true } },
} as const;

type ArticleWithRelations = {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: number; username: string; bio: string; image: string };
  tags: { name: string }[];
  favoritedBy: { id: number }[];
  _count: { favoritedBy: number };
};

export async function toArticleJson(
  article: ArticleWithRelations,
  currentUserId?: number
): Promise<ArticleJson> {
  const favorited = currentUserId
    ? article.favoritedBy.some((u) => u.id === currentUserId)
    : false;

  let following = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: article.author.id,
        },
      },
    });
    following = !!follow;
  }

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((t) => t.name).sort(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount: article._count.favoritedBy,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following,
    },
  };
}
