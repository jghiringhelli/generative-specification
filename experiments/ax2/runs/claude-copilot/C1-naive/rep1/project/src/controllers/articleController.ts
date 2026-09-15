import { Response } from 'express';
import slugify from 'slugify';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

async function buildArticleView(articleId: number, currentUserId?: number) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: true,
      tagList: true,
      favoritedBy: true,
    },
  });
  if (!article) return null;

  let following = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: article.authorId,
        },
      },
    });
    following = !!follow;
  }

  const favorited = currentUserId
    ? article.favoritedBy.some((u) => u.id === currentUserId)
    : false;

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
      bio: article.author.bio,
      image: article.author.image,
      following,
    },
  };
}

export async function listArticles(req: AuthRequest, res: Response) {
  const { tag, author, favorited } = req.query as Record<string, string>;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const where: any = {};
  if (tag) {
    where.tagList = { some: { name: tag } };
  }
  if (author) {
    where.author = { username: author };
  }
  if (favorited) {
    where.favoritedBy = { some: { username: favorited } };
  }

  const total = await prisma.article.count({ where });
  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  const views = await Promise.all(
    articles.map((a) => buildArticleView(a.id, req.user?.id))
  );

  return res.json({
    articles: views,
    articlesCount: total,
  });
}

export async function feedArticles(req: AuthRequest, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.id },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const where = { authorId: { in: followingIds } };

  const total = await prisma.article.count({ where });
  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  const views = await Promise.all(
    articles.map((a) => buildArticleView(a.id, req.user!.id))
  );

  return res.json({
    articles: views,
    articlesCount: total,
  });
}

export async function getArticle(req: AuthRequest, res: Response) {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const view = await buildArticleView(article.id, req.user?.id);
  return res.json({ article: view });
}

export async function createArticle(req: AuthRequest, res: Response) {
  const body = req.body.article;
  if (!body || !body.title || !body.description || !body.body) {
    return res.status(422).json({ errors: { body: ['title, description and body are required'] } });
  }
  const slug = await generateUniqueSlug(body.title);
  const tagList: string[] = Array.isArray(body.tagList) ? body.tagList : [];

  const article = await prisma.article.create({
    data: {
      slug,
      title: body.title,
      description: body.description,
      body: body.body,
      authorId: req.user!.id,
      tagList: {
        connectOrCreate: tagList.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  const view = await buildArticleView(article.id, req.user!.id);
  return res.status(201).json({ article: view });
}

export async function updateArticle(req: AuthRequest, res: Response) {
  const existing = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!existing) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  if (existing.authorId !== req.user!.id) {
    return res.status(403).json({ errors: { body: ['forbidden'] } });
  }
  const body = req.body.article || {};
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    data.title = body.title;
    data.slug = await generateUniqueSlug(body.title);
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.body !== undefined) data.body = body.body;

  const article = await prisma.article.update({
    where: { id: existing.id },
    data,
  });

  const view = await buildArticleView(article.id, req.user!.id);
  return res.json({ article: view });
}

export async function deleteArticle(req: AuthRequest, res: Response) {
  const existing = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!existing) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  if (existing.authorId !== req.user!.id) {
    return res.status(403).json({ errors: { body: ['forbidden'] } });
  }
  await prisma.article.delete({ where: { id: existing.id } });
  return res.status(200).json({});
}

export async function favoriteArticle(req: AuthRequest, res: Response) {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  await prisma.article.update({
    where: { id: article.id },
    data: {
      favoritedBy: { connect: { id: req.user!.id } },
    },
  });
  const view = await buildArticleView(article.id, req.user!.id);
  return res.json({ article: view });
}

export async function unfavoriteArticle(req: AuthRequest, res: Response) {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  await prisma.article.update({
    where: { id: article.id },
    data: {
      favoritedBy: { disconnect: { id: req.user!.id } },
    },
  });
  const view = await buildArticleView(article.id, req.user!.id);
  return res.json({ article: view });
}

export { buildArticleView };
