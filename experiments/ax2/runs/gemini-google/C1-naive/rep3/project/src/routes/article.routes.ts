import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { generateUniqueSlug, formatArticle } from '../utils/article.helper';

const router = Router();

const articleInclude = {
  author: {
    include: {
      followedBy: true
    }
  },
  tags: {
    include: {
      tag: true
    }
  },
  favoritedBy: true,
  _count: {
    select: {
      favoritedBy: true
    }
  }
};

// GET /api/articles/feed - feed of articles from followed users
router.get('/articles/feed', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

    const follows = await prisma.follows.findMany({
      where: { followerId: req.userId! },
      select: { followingId: true }
    });

    const followingUserIds = follows.map((f) => f.followingId);

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where: {
          authorId: { in: followingUserIds }
        },
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.article.count({
        where: {
          authorId: { in: followingUserIds }
        }
      })
    ]);

    return res.status(200).json({
      articles: articles.map((article) => formatArticle(article, req.userId)),
      articlesCount
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// GET /api/articles - list articles
router.get('/articles', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);
    const { tag, author, favorited } = req.query as {
      tag?: string;
      author?: string;
      favorited?: string;
    };

    const where: any = {};

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag
          }
        }
      };
    }

    if (author) {
      where.author = {
        username: author
      };
    }

    if (favorited) {
      where.favoritedBy = {
        some: {
          user: {
            username: favorited
          }
        }
      };
    }

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.article.count({ where })
    ]);

    return res.status(200).json({
      articles: articles.map((article) => formatArticle(article, req.userId)),
      articlesCount
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// POST /api/articles - create article
router.post('/articles', requireAuth, async (req: AuthRequest, res: Response) => {
  const { article } = req.body || {};

  if (!article || !article.title || !article.description || !article.body) {
    return res.status(422).json({
      errors: {
        body: ['title, description, and body are required']
      }
    });
  }

  try {
    const slug = await generateUniqueSlug(article.title);

    // Connect or create tags
    const tagList: string[] = Array.isArray(article.tagList) ? article.tagList : [];
    const tagCreates = [];
    for (const tagName of tagList) {
      const cleanTag = tagName.trim();
      if (cleanTag) {
        const tagRecord = await prisma.tag.upsert({
          where: { name: cleanTag },
          create: { name: cleanTag },
          update: {}
        });
        tagCreates.push({ tagId: tagRecord.id });
      }
    }

    const createdArticle = await prisma.article.create({
      data: {
        slug,
        title: article.title,
        description: article.description,
        body: article.body,
        authorId: req.userId!,
        tags: {
          create: tagCreates
        }
      },
      include: articleInclude
    });

    return res.status(201).json({
      article: formatArticle(createdArticle, req.userId)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// GET /api/articles/:slug - get article
router.get('/articles/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: articleInclude
    });

    if (!article) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    return res.status(200).json({
      article: formatArticle(article, req.userId)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// PUT /api/articles/:slug - update article
router.put('/articles/:slug', requireAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const { article: updateData } = req.body || {};

  if (!updateData) {
    return res.status(422).json({ errors: { body: ['article data is required'] } });
  }

  try {
    const existing = await prisma.article.findUnique({
      where: { slug }
    });

    if (!existing) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    if (existing.authorId !== req.userId) {
      return res.status(403).json({ errors: { article: ['forbidden'] } });
    }

    const dataToUpdate: any = {};
    if (updateData.title !== undefined) {
      dataToUpdate.title = updateData.title;
      dataToUpdate.slug = await generateUniqueSlug(updateData.title, existing.id);
    }
    if (updateData.description !== undefined) {
      dataToUpdate.description = updateData.description;
    }
    if (updateData.body !== undefined) {
      dataToUpdate.body = updateData.body;
    }

    if (Array.isArray(updateData.tagList)) {
      // Remove old tags
      await prisma.articleTag.deleteMany({
        where: { articleId: existing.id }
      });

      const tagCreates = [];
      for (const tagName of updateData.tagList) {
        const cleanTag = tagName.trim();
        if (cleanTag) {
          const tagRecord = await prisma.tag.upsert({
            where: { name: cleanTag },
            create: { name: cleanTag },
            update: {}
          });
          tagCreates.push({ tagId: tagRecord.id });
        }
      }
      dataToUpdate.tags = {
        create: tagCreates
      };
    }

    const updatedArticle = await prisma.article.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: articleInclude
    });

    return res.status(200).json({
      article: formatArticle(updatedArticle, req.userId)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// DELETE /api/articles/:slug - delete article
router.delete('/articles/:slug', requireAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  try {
    const existing = await prisma.article.findUnique({
      where: { slug }
    });

    if (!existing) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    if (existing.authorId !== req.userId) {
      return res.status(403).json({ errors: { article: ['forbidden'] } });
    }

    await prisma.article.delete({
      where: { id: existing.id }
    });

    return res.status(200).json({ message: 'Article successfully deleted' });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// POST /api/articles/:slug/favorite - favorite article
router.post('/articles/:slug/favorite', requireAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    await prisma.articleFavorite.upsert({
      where: {
        articleId_userId: {
          articleId: article.id,
          userId: req.userId!
        }
      },
      create: {
        articleId: article.id,
        userId: req.userId!
      },
      update: {}
    });

    const updatedArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: articleInclude
    });

    return res.status(200).json({
      article: formatArticle(updatedArticle, req.userId)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// DELETE /api/articles/:slug/favorite - unfavorite article
router.delete('/articles/:slug/favorite', requireAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    try {
      await prisma.articleFavorite.delete({
        where: {
          articleId_userId: {
            articleId: article.id,
            userId: req.userId!
          }
        }
      });
    } catch (e) {
      // If not favorited, ignore
    }

    const updatedArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: articleInclude
    });

    return res.status(200).json({
      article: formatArticle(updatedArticle, req.userId)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

export default router;
