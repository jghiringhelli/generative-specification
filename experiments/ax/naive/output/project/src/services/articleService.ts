import { PrismaClient } from '@prisma/client';
import { generateUniqueSlug } from '../utils/slug';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
}

interface ListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

async function getProfile(userId: number, currentUserId?: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      followers: currentUserId ? {
        where: { followerId: currentUserId }
      } : false
    }
  });

  return {
    username: user!.username,
    bio: user!.bio,
    image: user!.image,
    following: currentUserId ? (user!.followers as any[]).length > 0 : false
  };
}

async function formatArticle(article: any, currentUserId?: number) {
  const favoritesCount = await prisma.favorite.count({
    where: { articleId: article.id }
  });

  const favorited = currentUserId
    ? await prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: currentUserId,
            articleId: article.id
          }
        }
      }) !== null
    : false;

  const author = await getProfile(article.authorId, currentUserId);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((t: any) => t.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount,
    author
  };
}

async function formatArticleForList(article: any, currentUserId?: number) {
  const favoritesCount = await prisma.favorite.count({
    where: { articleId: article.id }
  });

  const favorited = currentUserId
    ? await prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: currentUserId,
            articleId: article.id
          }
        }
      }) !== null
    : false;

  const author = await getProfile(article.authorId, currentUserId);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tags.map((t: any) => t.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount,
    author
  };
}

export async function createArticle(userId: number, data: CreateArticleData) {
  const slug = generateUniqueSlug(data.title);

  const article = await prisma.article.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId: userId,
      tags: data.tagList ? {
        connectOrCreate: data.tagList.map(tag => ({
          where: { name: tag },
          create: { name: tag }
        }))
      } : undefined
    },
    include: {
      tags: true
    }
  });

  return formatArticle(article, userId);
}

export async function getArticle(slug: string, currentUserId?: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      tags: true
    }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  return formatArticle(article, currentUserId);
}

export async function updateArticle(slug: string, userId: number, data: UpdateArticleData) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  if (article.authorId !== userId) {
    throw new ForbiddenError('You can only update your own articles');
  }

  const updateData: any = {};
  if (data.title) {
    updateData.title = data.title;
    updateData.slug = generateUniqueSlug(data.title);
  }
  if (data.description) updateData.description = data.description;
  if (data.body) updateData.body = data.body;

  const updated = await prisma.article.update({
    where: { slug },
    data: updateData,
    include: {
      tags: true
    }
  });

  return formatArticle(updated, userId);
}

export async function deleteArticle(slug: string, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  if (article.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own articles');
  }

  await prisma.article.delete({
    where: { slug }
  });
}

export async function listArticles(query: ListArticlesQuery, currentUserId?: number) {
  const { tag, author, favorited, limit = 20, offset = 0 } = query;

  const where: any = {};

  if (tag) {
    where.tags = {
      some: { name: tag }
    };
  }

  if (author) {
    const authorUser = await prisma.user.findUnique({
      where: { username: author }
    });
    if (authorUser) {
      where.authorId = authorUser.id;
    } else {
      return { articles: [], articlesCount: 0 };
    }
  }

  if (favorited) {
    const favoritedUser = await prisma.user.findUnique({
      where: { username: favorited }
    });
    if (favoritedUser) {
      where.favorites = {
        some: { userId: favoritedUser.id }
      };
    } else {
      return { articles: [], articlesCount: 0 };
    }
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        tags: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.article.count({ where })
  ]);

  const formattedArticles = await Promise.all(
    articles.map(article => formatArticleForList(article, currentUserId))
  );

  return {
    articles: formattedArticles,
    articlesCount
  };
}

export async function getFeed(userId: number, limit = 20, offset = 0) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  });

  const followingIds = following.map(f => f.followingId);

  if (followingIds.length === 0) {
    return { articles: [], articlesCount: 0 };
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where: {
        authorId: { in: followingIds }
      },
      include: {
        tags: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.article.count({
      where: {
        authorId: { in: followingIds }
      }
    })
  ]);

  const formattedArticles = await Promise.all(
    articles.map(article => formatArticleForList(article, userId))
  );

  return {
    articles: formattedArticles,
    articlesCount
  };
}

export async function favoriteArticle(slug: string, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      tags: true
    }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  await prisma.favorite.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId: article.id
      }
    },
    create: {
      userId,
      articleId: article.id
    },
    update: {}
  });

  return formatArticle(article, userId);
}

export async function unfavoriteArticle(slug: string, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      tags: true
    }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  await prisma.favorite.deleteMany({
    where: {
      userId,
      articleId: article.id
    }
  });

  return formatArticle(article, userId);
}
