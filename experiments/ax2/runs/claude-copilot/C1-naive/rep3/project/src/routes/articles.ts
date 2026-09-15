import { Router, Response } from 'express';
import slugify from 'slugify';
import prisma from '../prisma';
import { auth, optionalAuth, AuthRequest } from '../middleware/auth';
import { articleInclude, toArticleResponse, ArticleWithRelations } from '../utils/article';

const router = Router();

function makeSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

async function connectTags(tagList: string[]) {
  const unique = Array.from(new Set(tagList.filter((t) => typeof t === 'string' && t.length > 0)));
  return Promise.all(
    unique.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
    )
  ).then((tags) => tags.map((t) => ({ id: t.id })));
}

// GET /api/articles/feed — feed from followed users
router.get('/feed', auth, async (req: AuthRequest, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.id },
    select: { followingId: true },
  });
  const authorIds = following.map((f) => f.followingId);

  const where = { authorId: { in: authorIds } };
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

  const serialized = await Promise.all(
    articles.map((a) => toArticleResponse(a as unknown as ArticleWithRelations, req.user!.id))
  );
  return res.json({ articles: serialized, articlesCount });
});

// GET /api/articles — list with filters
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { tag, author, favorited } = req.query as Record<string, string>;
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  const where: Record<string, unknown> = {};
  if (tag) where.tagList = { some: { name: tag } };
  if (author) where.author = { username: author };
  if (favorited) where.favoritedBy = { some: { username: favorited } };

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

  const serialized = await Promise.all(
    articles.map((a) => toArticleResponse(a as unknown as ArticleWithRelations, req.user?.id))
  );
  return res.json({ articles: serialized, articlesCount });
});

// POST /api/articles — create
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const body = req.body?.article || {};
  const { title, description, body: articleBody, tagList } = body;

  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["can't be blank"];
  if (!description) errors.description = ["can't be blank"];
  if (!articleBody) errors.body = ["can't be blank"];
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const tags = Array.isArray(tagList) ? await connectTags(tagList) : [];

  const article = await prisma.article.create({
    data: {
      slug: makeSlug(title),
      title,
      description,
      body: articleBody,
      authorId: req.user!.id,
      tagList: { connect: tags },
    },
    include: articleInclude,
  });

  return res
    .status(201)
    .json({ article: await toArticleResponse(article as unknown as ArticleWithRelations, req.user!.id) });
});

// GET /api/articles/:slug — get one
router.get('/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
    include: articleInclude,
  });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  return res.json({
    article: await toArticleResponse(article as unknown as ArticleWithRelations, req.user?.id),
  });
});

// PUT /api/articles/:slug — update
router.put('/:slug', auth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  if (existing.authorId !== req.user!.id) {
    return res.status(403).json({ errors: { body: ['forbidden'] } });
  }

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
  return res.json({
    article: await toArticleResponse(article as unknown as ArticleWithRelations, req.user!.id),
  });
});

// DELETE /api/articles/:slug — delete
router.delete('/:slug', auth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  if (existing.authorId !== req.user!.id) {
    return res.status(403).json({ errors: { body: ['forbidden'] } });
  }
  await prisma.article.delete({ where: { slug: req.params.slug } });
  return res.status(200).json({});
});

// POST /api/articles/:slug/favorite — favorite
router.post('/:slug/favorite', auth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const article = await prisma.article.update({
    where: { slug: req.params.slug },
    data: { favoritedBy: { connect: { id: req.user!.id } } },
    include: articleInclude,
  });
  return res.json({
    article: await toArticleResponse(article as unknown as ArticleWithRelations, req.user!.id),
  });
});

// DELETE /api/articles/:slug/favorite — unfavorite
router.delete('/:slug/favorite', auth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!existing) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const article = await prisma.article.update({
    where: { slug: req.params.slug },
    data: { favoritedBy: { disconnect: { id: req.user!.id } } },
    include: articleInclude,
  });
  return res.json({
    article: await toArticleResponse(article as unknown as ArticleWithRelations, req.user!.id),
  });
});

export default router;
