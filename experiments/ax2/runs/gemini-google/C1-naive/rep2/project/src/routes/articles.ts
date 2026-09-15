import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { makeSlug } from '../utils/slug';

const router = Router();

const articleInclude = {
  author: {
    include: {
      followedBy: true,
    },
  },
  tags: true,
  favorites: true,
  _count: {
    select: { favorites: true },
  },
};

export function formatArticle(article: any, currentUserId?: number) {
  const favorited = currentUserId
    ? article.favorites?.some((f: any) => f.userId === currentUserId) ?? false
    : false;
  const following = currentUserId
    ? article.author?.followedBy?.some((f: any) => f.followerId === currentUserId) ?? false
    : false;

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags ? article.tags.map((t: any) => t.name) : [],
    createdAt: article.createdAt instanceof Date ? article.createdAt.toISOString() : article.createdAt,
    updatedAt: article.updatedAt instanceof Date ? article.updatedAt.toISOString() : article.updatedAt,
    favorited,
    favoritesCount: article._count?.favorites ?? article.favorites?.length ?? 0,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following,
    },
  };
}

// GET /api/articles/feed - Feed articles from followed users
router.get('/articles/feed', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const offset = parseInt(req.query.offset as string, 10) || 0;

  const where = {
    author: {
      followedBy: {
        some: {
          followerId: currentUser.id,
        },
      },
    },
  };

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.article.count({ where }),
  ]);

  res.status(200).json({
    articles: articles.map((a) => formatArticle(a, currentUser.id)),
    articlesCount,
  });
});

// GET /api/articles - List articles with filters
router.get('/articles', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  const { tag, author, favorited } = req.query;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const offset = parseInt(req.query.offset as string, 10) || 0;

  const where: any = {};

  if (tag) {
    where.tags = {
      some: {
        name: String(tag),
      },
    };
  }

  if (author) {
    where.author = {
      username: String(author),
    };
  }

  if (favorited) {
    where.favorites = {
      some: {
        user: {
          username: String(favorited),
        },
      },
    };
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.article.count({ where }),
  ]);

  res.status(200).json({
    articles: articles.map((a) => formatArticle(a, currentUserId)),
    articlesCount,
  });
});

// GET /api/articles/:slug - Get single article
router.get('/articles/:slug', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug } = req.params;
  const currentUserId = req.user?.id;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  res.status(200).json({
    article: formatArticle(article, currentUserId),
  });
});

// POST /api/articles - Create article
router.post('/articles', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { article } = req.body || {};

  if (!article) {
    res.status(422).json({
      errors: { body: ['article object is required'] },
    });
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

  const slug = makeSlug(title);

  const tagsData = Array.isArray(tagList) && tagList.length > 0
    ? {
        connectOrCreate: tagList.map((name: string) => ({
          where: { name: String(name).trim() },
          create: { name: String(name).trim() },
        })),
      }
    : undefined;

  const createdArticle = await prisma.article.create({
    data: {
      slug,
      title,
      description,
      body,
      authorId: currentUser.id,
      tags: tagsData,
    },
    include: articleInclude,
  });

  res.status(201).json({
    article: formatArticle(createdArticle, currentUser.id),
  });
});

// PUT /api/articles/:slug - Update article
router.put('/articles/:slug', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { slug } = req.params;
  const { article } = req.body || {};

  if (!article) {
    res.status(422).json({
      errors: { body: ['article object is required'] },
    });
    return;
  }

  const existingArticle = await prisma.article.findUnique({
    where: { slug },
  });

  if (!existingArticle) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  if (existingArticle.authorId !== currentUser.id) {
    res.status(403).json({
      errors: { article: ['forbidden: you are not the author'] },
    });
    return;
  }

  const updateData: any = {};
  if (article.title !== undefined) {
    updateData.title = article.title;
    updateData.slug = makeSlug(article.title);
  }
  if (article.description !== undefined) {
    updateData.description = article.description;
  }
  if (article.body !== undefined) {
    updateData.body = article.body;
  }

  const updatedArticle = await prisma.article.update({
    where: { slug },
    data: updateData,
    include: articleInclude,
  });

  res.status(200).json({
    article: formatArticle(updatedArticle, currentUser.id),
  });
});

// DELETE /api/articles/:slug - Delete article
router.delete('/articles/:slug', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  if (article.authorId !== currentUser.id) {
    res.status(403).json({
      errors: { article: ['forbidden: you are not the author'] },
    });
    return;
  }

  await prisma.article.delete({
    where: { slug },
  });

  res.status(200).json({
    message: 'Article deleted successfully',
  });
});

// POST /api/articles/:slug/favorite - Favorite article
router.post('/articles/:slug/favorite', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  await prisma.favorite.upsert({
    where: {
      userId_articleId: {
        userId: currentUser.id,
        articleId: article.id,
      },
    },
    create: {
      userId: currentUser.id,
      articleId: article.id,
    },
    update: {},
  });

  const updatedArticle = await prisma.article.findUnique({
    where: { id: article.id },
    include: articleInclude,
  });

  res.status(200).json({
    article: formatArticle(updatedArticle, currentUser.id),
  });
});

// DELETE /api/articles/:slug/favorite - Unfavorite article
router.delete('/articles/:slug/favorite', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  try {
    await prisma.favorite.delete({
      where: {
        userId_articleId: {
          userId: currentUser.id,
          articleId: article.id,
        },
      },
    });
  } catch {
    // If not favorited, ignore
  }

  const updatedArticle = await prisma.article.findUnique({
    where: { id: article.id },
    include: articleInclude,
  });

  res.status(200).json({
    article: formatArticle(updatedArticle, currentUser.id),
  });
});

export default router;
