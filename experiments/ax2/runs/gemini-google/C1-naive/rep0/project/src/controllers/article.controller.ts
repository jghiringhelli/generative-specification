import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest, ArticleResponse } from '../types';
import { createSlug } from '../utils/slugify';

type RawArticleWithRelations = {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    bio: string | null;
    image: string | null;
    followedBy?: { followerId: number }[];
  };
  tags: { name: string }[];
  favorites?: { userId: number }[];
  _count?: { favorites: number };
};

const getArticleInclude = (userId?: number) => ({
  author: userId
    ? {
        include: {
          followedBy: { where: { followerId: userId } }
        }
      }
    : true,
  tags: true,
  favorites: userId ? { where: { userId } } : undefined,
  _count: {
    select: { favorites: true }
  }
});

const formatArticle = (
  article: RawArticleWithRelations,
  currentUserId?: number
): ArticleResponse => {
  const favorited = currentUserId
    ? (article.favorites ? article.favorites.some((f) => f.userId === currentUserId) : false)
    : false;

  const following = currentUserId
    ? (article.author.followedBy ? article.author.followedBy.some((f) => f.followerId === currentUserId) : false)
    : false;

  const favoritesCount = article._count ? article._count.favorites : (article.favorites ? article.favorites.length : 0);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags ? article.tags.map((t) => t.name) : [],
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount,
    author: {
      username: article.author.username,
      bio: article.author.bio || '',
      image: article.author.image || '',
      following
    }
  };
};

export const listArticles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { tag, author, favorited, limit = 20, offset = 0 } = req.query;

  const take = Number(limit) > 0 ? Number(limit) : 20;
  const skip = Number(offset) >= 0 ? Number(offset) : 0;

  const whereClause: any = {};

  if (tag) {
    whereClause.tags = {
      some: {
        name: String(tag)
      }
    };
  }

  if (author) {
    whereClause.author = {
      username: String(author)
    };
  }

  if (favorited) {
    whereClause.favorites = {
      some: {
        user: {
          username: String(favorited)
        }
      }
    };
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      include: getArticleInclude(req.user?.id),
      orderBy: { createdAt: 'desc' },
      take,
      skip
    }),
    prisma.article.count({ where: whereClause })
  ]);

  res.status(200).json({
    articles: articles.map((a: any) => formatArticle(a, req.user?.id)),
    articlesCount
  });
};

export const getFeed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { limit = 20, offset = 0 } = req.query;
  const take = Number(limit) > 0 ? Number(limit) : 20;
  const skip = Number(offset) >= 0 ? Number(offset) : 0;

  const follows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true }
  });

  const followingIds = follows.map((f) => f.followingId);

  const whereClause = {
    authorId: {
      in: followingIds
    }
  };

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      include: getArticleInclude(req.user.id),
      orderBy: { createdAt: 'desc' },
      take,
      skip
    }),
    prisma.article.count({ where: whereClause })
  ]);

  res.status(200).json({
    articles: articles.map((a: any) => formatArticle(a, req.user?.id)),
    articlesCount
  });
};

export const getArticle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: getArticleInclude(req.user?.id)
  });

  if (!article) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  res.status(200).json({
    article: formatArticle(article as any, req.user?.id)
  });
};

export const createArticle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { article } = req.body || {};
  if (!article) {
    res.status(422).json({ errors: { body: ["can't be empty"] } });
    return;
  }

  const { title, description, body, tagList } = article;
  const errors: Record<string, string[]> = {};

  if (!title) errors.title = ["can't be blank"];
  if (!description) errors.description = ["can't be blank"];
  if (!body) errors.body = ["can't be blank"];

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  const slug = createSlug(title);

  const tagsConnectOrCreate = Array.isArray(tagList)
    ? tagList.map((tag: string) => ({
        where: { name: tag.trim() },
        create: { name: tag.trim() }
      }))
    : [];

  const newArticle = await prisma.article.create({
    data: {
      slug,
      title,
      description,
      body,
      authorId: req.user.id,
      tags: {
        connectOrCreate: tagsConnectOrCreate
      }
    },
    include: getArticleInclude(req.user.id)
  });

  res.status(201).json({
    article: formatArticle(newArticle as any, req.user.id)
  });
};

export const updateArticle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { slug } = req.params;
  const { article } = req.body || {};

  if (!article) {
    res.status(422).json({ errors: { body: ["can't be empty"] } });
    return;
  }

  const existingArticle = await prisma.article.findUnique({
    where: { slug }
  });

  if (!existingArticle) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  if (existingArticle.authorId !== req.user.id) {
    res.status(403).json({ errors: { article: ['Forbidden: You are not the author'] } });
    return;
  }

  const updateData: {
    title?: string;
    description?: string;
    body?: string;
    slug?: string;
  } = {};

  if (article.title !== undefined) {
    updateData.title = article.title;
    updateData.slug = createSlug(article.title);
  }

  if (article.description !== undefined) {
    updateData.description = article.description;
  }

  if (article.body !== undefined) {
    updateData.body = article.body;
  }

  const updated = await prisma.article.update({
    where: { slug },
    data: updateData,
    include: getArticleInclude(req.user.id)
  });

  res.status(200).json({
    article: formatArticle(updated as any, req.user.id)
  });
};

export const deleteArticle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { slug } = req.params;

  const existingArticle = await prisma.article.findUnique({
    where: { slug }
  });

  if (!existingArticle) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  if (existingArticle.authorId !== req.user.id) {
    res.status(403).json({ errors: { article: ['Forbidden: You are not the author'] } });
    return;
  }

  await prisma.article.delete({
    where: { slug }
  });

  res.status(200).json({});
};

export const favoriteArticle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  await prisma.favorite.upsert({
    where: {
      userId_articleId: {
        userId: req.user.id,
        articleId: article.id
      }
    },
    update: {},
    create: {
      userId: req.user.id,
      articleId: article.id
    }
  });

  const updatedArticle = await prisma.article.findUnique({
    where: { id: article.id },
    include: getArticleInclude(req.user.id)
  });

  res.status(200).json({
    article: formatArticle(updatedArticle as any, req.user.id)
  });
};

export const unfavoriteArticle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  try {
    await prisma.favorite.delete({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId: article.id
        }
      }
    });
  } catch (err) {
    // Not favorited
  }

  const updatedArticle = await prisma.article.findUnique({
    where: { id: article.id },
    include: getArticleInclude(req.user.id)
  });

  res.status(200).json({
    article: formatArticle(updatedArticle as any, req.user.id)
  });
};
