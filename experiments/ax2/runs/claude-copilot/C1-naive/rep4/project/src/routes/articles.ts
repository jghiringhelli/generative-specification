import { Router, Request, Response } from 'express';
import slugify from 'slugify';
import prisma from '../prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { toArticleJson, articleInclude } from '../utils/articleView';
import { notFound, forbidden, unprocessable } from '../utils/errors';

const router = Router();

function makeSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

async function connectTags(tagList: string[]) {
  const names = Array.from(new Set(tagList.filter((t) => typeof t === 'string' && t.trim() !== '')));
  const tags = [];
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    tags.push({ id: tag.id });
  }
  return tags;
}

// GET /api/articles/feed — feed of followed users (must be before :slug)
router.get('/articles/feed', requireAuth, async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 100);
  const offset = parseInt(String(req.query.offset ?? '0'), 10) || 0;

  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.id },
    select: { followingId: true },
  });
  const authorIds = following.map((f) => f.followingId);

  const [articles, count] = await Promise.all([
    prisma.article.findMany({
      where: { authorId: { in: authorIds } },
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.article.count({ where: { authorId: { in: authorIds } } }),
  ]);

  const articlesJson = await Promise.all(articles.map((a) => toArticleJson(a, req.user!.id)));
  res.json({ articles: articlesJson, articlesCount: count });
});

// GET /api/articles — list articles with filters
router.get('/articles', optionalAuth, async (req: Request, res: Response) => {
  const { tag, author, favorited } = req.query as Record<string, string | undefined>;
  const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 100);
  const offset = parseInt(String(req.query.offset ?? '0'), 10) || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (tag) where.tags = { some: { name: tag } };
  if (author) where.author = { username: author };
  if (favorited) where.favoritedBy = { some: { username: favorited } };

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

  const articlesJson = await Promise.all(articles.map((a) => toArticleJson(a, req.user?.id)));
  res.json({ articles: articlesJson, articlesCount: count });
});

// GET /api/articles/:slug — get single article
router.get('/articles/:slug', optionalAuth, async (req: Request, res: Response) => {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
    include: articleInclude,
  });
  if (!article) throw notFound('Article not found');

  res.json({ article: await toArticleJson(article, req.user?.id) });
});

// POST /api/articles — create article
router.post('/articles', requireAuth, async (req: Request, res: Response) => {
  const input = req.body?.article || {};
  const { title, description, body, tagList } = input;

  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["can't be blank"];
  if (!description) errors.description = ["can't be blank"];
  if (!body) errors.body = ["can't be blank"];
  if (Object.keys(errors).length > 0) throw unprocessable(errors);

  const tags = await connectTags(Array.isArray(tagList) ? tagList : []);

  const article = await prisma.article.create({
    data: {
      slug: makeSlug(title),
      title,
      description,
      body,
      authorId: req.user!.id,
      tags: { connect: tags },
    },
    include: articleInclude,
  });

  res.status(201).json({ article: await toArticleJson(article, req.user!.id) });
});

// PUT /api/articles/:slug — update article
router.put('/articles/:slug', requireAuth, async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) throw notFound('Article not found');
  if (existing.authorId !== req.user!.id) throw forbidden('You are not the author');

  const input = req.body?.article || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (input.title !== undefined) {
    data.title = input.title;
    data.slug = makeSlug(input.title);
  }
  if (input.description !== undefined) data.description = input.description;
  if (input.body !== undefined) data.body = input.body;

  const updated = await prisma.article.update({
    where: { id: existing.id },
    data,
    include: articleInclude,
  });

  res.json({ article: await toArticleJson(updated, req.user!.id) });
});

// DELETE /api/articles/:slug — delete article
router.delete('/articles/:slug', requireAuth, async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) throw notFound('Article not found');
  if (existing.authorId !== req.user!.id) throw forbidden('You are not the author');

  await prisma.article.delete({ where: { id: existing.id } });
  res.status(200).json({});
});

// POST /api/articles/:slug/favorite — favorite article
router.post('/articles/:slug/favorite', requireAuth, async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) throw notFound('Article not found');

  await prisma.article.update({
    where: { id: existing.id },
    data: { favoritedBy: { connect: { id: req.user!.id } } },
  });

  const article = await prisma.article.findUnique({
    where: { id: existing.id },
    include: articleInclude,
  });
  res.json({ article: await toArticleJson(article!, req.user!.id) });
});

// DELETE /api/articles/:slug/favorite — unfavorite article
router.delete('/articles/:slug/favorite', requireAuth, async (req: Request, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) throw notFound('Article not found');

  await prisma.article.update({
    where: { id: existing.id },
    data: { favoritedBy: { disconnect: { id: req.user!.id } } },
  });

  const article = await prisma.article.findUnique({
    where: { id: existing.id },
    include: articleInclude,
  });
  res.json({ article: await toArticleJson(article!, req.user!.id) });
});

export default router;
