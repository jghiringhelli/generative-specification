import prisma from '../prisma';

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';
}

export async function generateUniqueSlug(title: string, currentArticleId?: number): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug }
    });

    if (!existing || (currentArticleId && existing.id === currentArticleId)) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter++;
  }
}

export function formatArticle(article: any, currentUserId?: number) {
  const rawTags = article.tags
    ? article.tags.map((t: any) => (t.tag ? t.tag.name : t.name || t))
    : [];
  const tagList = Array.from(new Set(rawTags));

  const favoritesCount =
    article._count?.favoritedBy !== undefined
      ? article._count.favoritedBy
      : article.favoritedBy
      ? article.favoritedBy.length
      : 0;

  let favorited = false;
  if (currentUserId && article.favoritedBy) {
    favorited = article.favoritedBy.some(
      (f: any) => f.userId === currentUserId || f === currentUserId
    );
  }

  let following = false;
  if (currentUserId && article.author) {
    if (article.author.followedBy && Array.isArray(article.author.followedBy)) {
      following = article.author.followedBy.some(
        (f: any) => f.followerId === currentUserId
      );
    }
  }

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited,
    favoritesCount,
    author: {
      username: article.author?.username,
      bio: article.author?.bio ?? '',
      image: article.author?.image ?? null,
      following
    }
  };
}
