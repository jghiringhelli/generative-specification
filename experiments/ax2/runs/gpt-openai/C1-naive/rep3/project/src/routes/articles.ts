import { Prisma, Article } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, optionalAuth, requireAuth } from '../middleware/auth';
import { formatArticle } from '../utils/responses';
import { createSlug } from '../utils/slug';

export const articlesRouter = Router();

const articleInclude = {
  author: { include: { followers: true } },
  tags: { include: { tag: true } },
  favorites: true,
} as const;

function paginationValue(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

async function findArticle(slug: string) {
  return prisma.article.findUnique({ where: { slug }, include: articleInclude });
}

async function findOwnedArticle(slug: string, userId: number): Promise<Article | null> {
  return prisma.article.findFirst({ where: { slug, authorId: userId } });
}

articlesRouter.get('/articles/feed', requireAuth, async (request: AuthenticatedRequest, response) => {
  const limit = paginationValue(request.query.limit, 20);
  const offset = paginationValue(request.query.offset, 0);
  const where: Prisma.ArticleWhereInput = {
    author: { followers: { some: { followerId: request.userId } } },
  };
  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({ where, include: articleInclude, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
    prisma.article.count({ where }),
  ]);
  response.json({
    articles: articles.map((article) => formatArticle(article, request.userId)),
    articlesCount,
  });
});

articlesRouter.get('/articles', optionalAuth, async (request: AuthenticatedRequest, response) => {
  const limit = paginationValue(request.query.limit, 20);
  const offset = paginationValue(request.query.offset, 0);
  const where: Prisma.ArticleWhereInput = {};
  if (typeof request.query.tag === 'string') where.tags = { some: { tagName: request.query.tag } };
  if (typeof request.query.author === 'string') where.author = { username: request.query.author };
  if (typeof request.query.favorited === 'string') {
    where.favorites = { some: { user: { username: request.query.favorited } } };
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({ where, include: articleInclude, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
    prisma.article.count({ where }),
  ]);
  response.json({
    articles: articles.map((article) => formatArticle(article, request.userId)),
    articlesCount,
  });
});

articlesRouter.get('/articles/:slug', optionalAuth, async (request: AuthenticatedRequest, response) => {
  const article = await findArticle(request.params.slug);
  if (!article) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }
  response.json({ article: formatArticle(article, request.userId) });
});

articlesRouter.post('/articles', requireAuth, async (request: AuthenticatedRequest, response) => {
  const { title, description, body, tagList = [] } = request.body.article ?? {};
  const uniqueTags = Array.isArray(tagList) ? [...new Set<string>(tagList)] : [];
  if (!title || !description || !body) {
    response.status(422).json({ errors: { body: ['title, description and body are required'] } });
    return;
  }

  const article = await prisma.article.create({
    data: {
      slug: createSlug(title),
      title,
      description,
      body,
      authorId: request.userId!,
      tags: {
        create: uniqueTags.map((tagName) => ({
          tag: { connectOrCreate: { where: { name: tagName }, create: { name: tagName } } },
        })),
      },
    },
    include: articleInclude,
  });
  response.status(201).json({ article: formatArticle(article, request.userId) });
});

articlesRouter.put('/articles/:slug', requireAuth, async (request: AuthenticatedRequest, response) => {
  const existing = await findOwnedArticle(request.params.slug, request.userId!);
  if (!existing) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }

  const changes = request.body.article ?? {};
  const data: Prisma.ArticleUpdateInput = {};
  if (changes.title !== undefined) {
    data.title = changes.title;
    data.slug = createSlug(changes.title);
  }
  if (changes.description !== undefined) data.description = changes.description;
  if (changes.body !== undefined) data.body = changes.body;
  if (Array.isArray(changes.tagList)) {
    data.tags = {
      deleteMany: {},
      create: uniqueTags.map((tagName) => ({
        tag: { connectOrCreate: { where: { name: tagName }, create: { name: tagName } } },
      })),
    };
  }

  const article = await prisma.article.update({
    where: { id: existing.id },
    data,
    include: articleInclude,
  });
  response.json({ article: formatArticle(article, request.userId) });
});

articlesRouter.delete('/articles/:slug', requireAuth, async (request: AuthenticatedRequest, response) => {
  const article = await findOwnedArticle(request.params.slug, request.userId!);
  if (!article) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }
  await prisma.article.delete({ where: { id: article.id } });
  response.status(204).send();
});

articlesRouter.post('/articles/:slug/favorite', requireAuth, async (request: AuthenticatedRequest, response) => {
  const article = await findArticle(request.params.slug);
  if (!article) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }
  await prisma.favorite.upsert({
    where: { userId_articleId: { userId: request.userId!, articleId: article.id } },
    update: {},
    create: { userId: request.userId!, articleId: article.id },
  });
  const updated = await findArticle(article.slug);
  response.json({ article: formatArticle(updated!, request.userId) });
});

articlesRouter.delete('/articles/:slug/favorite', requireAuth, async (request: AuthenticatedRequest, response) => {
  const article = await findArticle(request.params.slug);
  if (!article) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }
  await prisma.favorite.deleteMany({ where: { userId: request.userId, articleId: article.id } });
  const updated = await findArticle(article.slug);
  response.json({ article: formatArticle(updated!, request.userId) });
});

