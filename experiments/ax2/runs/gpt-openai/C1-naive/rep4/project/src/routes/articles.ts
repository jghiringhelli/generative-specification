import { Prisma } from "@prisma/client";
import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { ApiError } from "../errors";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();
const articleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
  tagList: z.array(z.string().min(1)).optional().default([]),
});
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  tagList: z.array(z.string().min(1)).optional(),
});
const listSchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const includeArticleRelations = (viewerId?: number) =>
  ({
    author: {
      include: {
        followers: viewerId ? { where: { followerId: viewerId } } : false,
      },
    },
    tags: { include: { tag: true } },
    favorites: true,
  }) satisfies Prisma.ArticleInclude;

type ArticleResult = Prisma.ArticleGetPayload<{
  include: {
    author: { include: { followers: true } };
    tags: { include: { tag: true } };
    favorites: true;
  };
}>;

function serializeArticle(article: ArticleResult, viewerId?: number) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map(({ tag }) => tag.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: viewerId
      ? article.favorites.some((favorite) => favorite.userId === viewerId)
      : false,
    favoritesCount: article.favorites.length,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: Boolean(article.author.followers?.length),
    },
  };
}

async function uniqueSlug(title: string, existingArticleId?: number): Promise<string> {
  const base = slugify(title, { lower: true, strict: true }) || "article";
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === existingArticleId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

async function getArticle(slug: string, viewerId?: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: includeArticleRelations(viewerId),
  });
  if (!article) throw new ApiError(404, "article not found");
  return article as ArticleResult;
}

router.get("/articles", optionalAuth, async (request, response, next) => {
  try {
    const query = listSchema.parse(request.query);
    const where: Prisma.ArticleWhereInput = {
      tags: query.tag ? { some: { tag: { name: query.tag } } } : undefined,
      author: query.author ? { username: query.author } : undefined,
      favorites: query.favorited
        ? { some: { user: { username: query.favorited } } }
        : undefined,
    };
    const [articles, articlesCount] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        include: includeArticleRelations(request.userId),
        orderBy: { createdAt: "desc" },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.article.count({ where }),
    ]);
    response.json({
      articles: (articles as ArticleResult[]).map((article) =>
        serializeArticle(article, request.userId),
      ),
      articlesCount,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/feed", requireAuth, async (request, response, next) => {
  try {
    const query = listSchema.pick({ limit: true, offset: true }).parse(request.query);
    const where = { author: { followers: { some: { followerId: request.userId } } } };
    const [articles, articlesCount] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        include: includeArticleRelations(request.userId),
        orderBy: { createdAt: "desc" },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.article.count({ where }),
    ]);
    response.json({
      articles: (articles as ArticleResult[]).map((article) =>
        serializeArticle(article, request.userId),
      ),
      articlesCount,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/:slug", optionalAuth, async (request, response, next) => {
  try {
    const article = await getArticle(request.params.slug, request.userId);
    response.json({ article: serializeArticle(article, request.userId) });
  } catch (error) {
    next(error);
  }
});

router.post("/articles", requireAuth, async (request, response, next) => {
  try {
    const input = articleSchema.parse(request.body?.article);
    const tagList = [...new Set(input.tagList)];
    const article = await prisma.article.create({
      data: {
        title: input.title,
        slug: await uniqueSlug(input.title),
        description: input.description,
        body: input.body,
        authorId: request.userId!,
        tags: {
          create: tagList.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include: includeArticleRelations(request.userId),
    });
    response.status(201).json({
      article: serializeArticle(article as ArticleResult, request.userId),
    });
  } catch (error) {
    next(error);
  }
});

router.put("/articles/:slug", requireAuth, async (request, response, next) => {
  try {
    const input = updateSchema.parse(request.body?.article);
    const tagList = input.tagList ? [...new Set(input.tagList)] : undefined;
    const current = await prisma.article.findUnique({ where: { slug: request.params.slug } });
    if (!current) throw new ApiError(404, "article not found");
    if (current.authorId !== request.userId) throw new ApiError(403, "not the article author");

    const article = await prisma.article.update({
      where: { id: current.id },
      data: {
        title: input.title,
        slug: input.title ? await uniqueSlug(input.title, current.id) : undefined,
        description: input.description,
        body: input.body,
        tags: tagList
          ? {
              deleteMany: {},
              create: tagList.map((name) => ({
                tag: { connectOrCreate: { where: { name }, create: { name } } },
              })),
            }
          : undefined,
      },
      include: includeArticleRelations(request.userId),
    });
    response.json({ article: serializeArticle(article as ArticleResult, request.userId) });
  } catch (error) {
    next(error);
  }
});

router.delete("/articles/:slug", requireAuth, async (request, response, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: request.params.slug } });
    if (!article) throw new ApiError(404, "article not found");
    if (article.authorId !== request.userId) throw new ApiError(403, "not the article author");
    await prisma.article.delete({ where: { id: article.id } });
    response.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

async function setFavorite(slug: string, userId: number, favorite: boolean) {
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) throw new ApiError(404, "article not found");

  if (favorite) {
    await prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId: article.id } },
      create: { userId, articleId: article.id },
      update: {},
    });
  } else {
    await prisma.favorite.deleteMany({ where: { userId, articleId: article.id } });
  }
  return getArticle(slug, userId);
}

router.post("/articles/:slug/favorite", requireAuth, async (request, response, next) => {
  try {
    const article = await setFavorite(request.params.slug, request.userId!, true);
    response.json({ article: serializeArticle(article, request.userId) });
  } catch (error) {
    next(error);
  }
});

router.delete("/articles/:slug/favorite", requireAuth, async (request, response, next) => {
  try {
    const article = await setFavorite(request.params.slug, request.userId!, false);
    response.json({ article: serializeArticle(article, request.userId) });
  } catch (error) {
    next(error);
  }
});

export default router;
