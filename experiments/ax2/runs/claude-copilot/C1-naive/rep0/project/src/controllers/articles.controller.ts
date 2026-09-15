import { Response } from 'express';
import slugify from 'slugify';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

interface ArticleAuthor {
  id: number;
  username: string;
  bio: string | null;
  image: string | null;
}

interface ArticleWithRelations {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: ArticleAuthor;
  tags: { name: string }[];
  favorites: { userId: number }[];
}

const articleInclude = {
  author: true,
  tags: true,
  favorites: true,
};

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true }) || 'article';
  let slug = base;
  let counter = 1;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function isFollowing(currentUserId: number, authorId: number): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: currentUserId, followingId: authorId },
    },
  });
  return !!follow;
}

async function toArticleResponse(
  article: ArticleWithRelations,
  currentUserId?: number
) {
  const favorited = currentUserId
    ? article.favorites.some((f) => f.userId === currentUserId)
    : false;
  const following = currentUserId
    ? await isFollowing(currentUserId, article.author.id)
    : false;

  return {
    article: {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((t) => t.name).sort(),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article.favorites.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following,
      },
    },
  };
}

export async function listArticles(req: AuthRequest, res: Response): Promise<void> {
  const { tag, author, favorited } = req.query as Record<string, string | undefined>;
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10) || 20, 100);
  const offset = parseInt((req.query.offset as string) || '0', 10) || 0;

  const where: Record<string, unknown> = {};
  if (tag) where.tags = { some: { name: tag } };
  if (author) where.author = { username: author };
  if (favorited) where.favorites = { some: { user: { username: favorited } } };

  const [articles, count] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  const rendered = await Promise.all(
    articles.map((a) => toArticleResponse(a as ArticleWithRelations, req.user?.id))
  );

  res.json({
    articles: rendered.map((r) => r.article),
    articlesCount: count,
  });
}

export async function feedArticles(req: AuthRequest, res: Response): Promise<void> {
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10) || 20, 100);
  const offset = parseInt((req.query.offset as string) || '0', 10) || 0;

  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.id },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const where = { authorId: { in: followingIds } };

  const [articles, count] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  const rendered = await Promise.all(
    articles.map((a) => toArticleResponse(a as ArticleWithRelations, req.user!.id))
  );

  res.json({
    articles: rendered.map((r) => r.article),
    articlesCount: count,
  });
}

export async function getArticle(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
  if (!article) {
    throw new HttpError(404, ['article not found']);
  }
  res.json(await toArticleResponse(article as ArticleWithRelations, req.user?.id));
}

export async function createArticle(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body?.article;
  if (!payload) {
    throw new HttpError(422, ["can't be blank"]);
  }
  const { title, description, body, tagList } = payload;
  if (!title || !description || !body) {
    const errors: string[] = [];
    if (!title) errors.push('title is required');
    if (!description) errors.push('description is required');
    if (!body) errors.push('body is required');
    throw new HttpError(422, errors);
  }

  const slug = await generateUniqueSlug(title);
  const tags: string[] = Array.isArray(tagList) ? tagList : [];

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      description,
      body,
      authorId: req.user!.id,
      tags: {
        connectOrCreate: tags.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: articleInclude,
  });

  res.status(201).json(await toArticleResponse(article as ArticleWithRelations, req.user!.id));
}

export async function updateArticle(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) {
    throw new HttpError(404, ['article not found']);
  }
  if (existing.authorId !== req.user!.id) {
    throw new HttpError(403, ['forbidden']);
  }

  const payload = req.body?.article ?? {};
  const data: Record<string, unknown> = {};
  if (payload.title !== undefined) {
    data.title = payload.title;
    data.slug = await generateUniqueSlug(payload.title);
  }
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.body !== undefined) data.body = payload.body;

  const article = await prisma.article.update({
    where: { slug },
    data,
    include: articleInclude,
  });

  res.json(await toArticleResponse(article as ArticleWithRelations, req.user!.id));
}

export async function deleteArticle(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) {
    throw new HttpError(404, ['article not found']);
  }
  if (existing.authorId !== req.user!.id) {
    throw new HttpError(403, ['forbidden']);
  }
  await prisma.article.delete({ where: { slug } });
  res.status(200).json({});
}

export async function favoriteArticle(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    throw new HttpError(404, ['article not found']);
  }
  await prisma.favorite.upsert({
    where: {
      userId_articleId: { userId: req.user!.id, articleId: article.id },
    },
    update: {},
    create: { userId: req.user!.id, articleId: article.id },
  });
  const updated = await prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
  res.json(await toArticleResponse(updated as ArticleWithRelations, req.user!.id));
}

export async function unfavoriteArticle(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    throw new HttpError(404, ['article not found']);
  }
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.id, articleId: article.id },
  });
  const updated = await prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
  res.json(await toArticleResponse(updated as ArticleWithRelations, req.user!.id));
}
