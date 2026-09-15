import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { makeSlug } from '../utils/slug';
import { articleInclude, toArticle } from '../utils/article';
import { isFollowing, toProfile } from '../utils/profile';

const router = Router();

// GET /api/articles — list articles
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { tag, author, favorited } = req.query as Record<string, string>;
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const where: Record<string, unknown> = {};
    if (tag) where.tags = { some: { name: tag } };
    if (author) where.author = { username: author };
    if (favorited)
      where.favorites = { some: { user: { username: favorited } } };

    const [articles, count] = await Promise.all([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.article.count({ where }),
    ]);

    const list = await Promise.all(
      articles.map((a) => toArticle(a as any, req.user?.id))
    );
    res.json({ articles: list, articlesCount: count });
  } catch (err) {
    next(err);
  }
});

// GET /api/articles/feed
router.get(
  '/feed',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const limit = Math.min(
        parseInt((req.query.limit as string) || '20', 10),
        100
      );
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const following = await prisma.follow.findMany({
        where: { followerId: req.user!.id },
        select: { followingId: true },
      });
      const authorIds = following.map((f) => f.followingId);
      const where = { authorId: { in: authorIds } };

      const [articles, count] = await Promise.all([
        prisma.article.findMany({
          where,
          include: articleInclude,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.article.count({ where }),
      ]);

      const list = await Promise.all(
        articles.map((a) => toArticle(a as any, req.user!.id))
      );
      res.json({ articles: list, articlesCount: count });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/articles/:slug
router.get(
  '/:slug',
  optionalAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: req.params.slug },
        include: articleInclude,
      });
      if (!article) throw new HttpError(404, 'Article not found');
      res.json({ article: await toArticle(article as any, req.user?.id) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/articles
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body?.article;
    if (!body) throw new HttpError(422, "can't be blank");
    const { title, description, body: articleBody, tagList } = body;
    const errors: string[] = [];
    if (!title) errors.push("title can't be blank");
    if (!description) errors.push("description can't be blank");
    if (!articleBody) errors.push("body can't be blank");
    if (errors.length) throw new HttpError(422, errors);

    const tags: string[] = Array.isArray(tagList) ? tagList : [];

    const article = await prisma.article.create({
      data: {
        slug: makeSlug(title),
        title,
        description,
        body: articleBody,
        authorId: req.user!.id,
        tags: {
          connectOrCreate: tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: articleInclude,
    });
    res
      .status(201)
      .json({ article: await toArticle(article as any, req.user!.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/articles/:slug
router.put(
  '/:slug',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const existing = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!existing) throw new HttpError(404, 'Article not found');
      if (existing.authorId !== req.user!.id)
        throw new HttpError(403, 'You are not the author of this article');

      const body = req.body?.article || {};
      const data: Record<string, unknown> = {};
      if (body.title !== undefined) {
        data.title = body.title;
        data.slug = makeSlug(body.title);
      }
      if (body.description !== undefined) data.description = body.description;
      if (body.body !== undefined) data.body = body.body;

      const article = await prisma.article.update({
        where: { slug: req.params.slug },
        data,
        include: articleInclude,
      });
      res.json({ article: await toArticle(article as any, req.user!.id) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/articles/:slug
router.delete(
  '/:slug',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const existing = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!existing) throw new HttpError(404, 'Article not found');
      if (existing.authorId !== req.user!.id)
        throw new HttpError(403, 'You are not the author of this article');

      await prisma.article.delete({ where: { slug: req.params.slug } });
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/articles/:slug/favorite
router.post(
  '/:slug/favorite',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!article) throw new HttpError(404, 'Article not found');

      await prisma.favorite.upsert({
        where: {
          userId_articleId: {
            userId: req.user!.id,
            articleId: article.id,
          },
        },
        create: { userId: req.user!.id, articleId: article.id },
        update: {},
      });

      const updated = await prisma.article.findUnique({
        where: { id: article.id },
        include: articleInclude,
      });
      res.json({ article: await toArticle(updated as any, req.user!.id) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/articles/:slug/favorite
router.delete(
  '/:slug/favorite',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!article) throw new HttpError(404, 'Article not found');

      await prisma.favorite.deleteMany({
        where: { userId: req.user!.id, articleId: article.id },
      });

      const updated = await prisma.article.findUnique({
        where: { id: article.id },
        include: articleInclude,
      });
      res.json({ article: await toArticle(updated as any, req.user!.id) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
