import prisma from '../prisma';

export interface ArticleWithRelations {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  tagList: { name: string }[];
  favoritedBy: { id: number }[];
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export const articleInclude = {
  tagList: true,
  favoritedBy: { select: { id: true } },
  author: true,
};

/**
 * Serialize an article (with included relations) into the RealWorld response shape.
 */
export async function toArticleResponse(article: ArticleWithRelations, currentUserId?: number) {
  const favorited = currentUserId
    ? article.favoritedBy.some((u) => u.id === currentUserId)
    : false;

  let following = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: currentUserId, followingId: article.authorId },
      },
    });
    following = !!follow;
  }

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList.map((t) => t.name).sort(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount: article.favoritedBy.length,
    author: {
      username: article.author.username,
      bio: article.author.bio || '',
      image: article.author.image || '',
      following,
    },
  };
}
