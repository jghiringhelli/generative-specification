import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";
import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";

import { ApiError } from "../errors";
import {
  optionalAuthentication,
  requireAuthentication,
} from "../middleware/authentication";
import { prisma } from "../prisma";
import { toArticleResponse } from "./article.dto";
import { articleInclude, findArticle } from "./article.repository";

const router = Router();
const articleFields = z.object({
  title: z.string().min(1),
  description: z.string(),
  body: z.string(),
  tagList: z.array(z.string()).default([]),
});
const createSchema = z.object({ article: articleFields });
const updateSchema = z.object({
  article: articleFields.partial(),
});
const listSchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get("/articles/feed", requireAuthentication, async (request, response, next) => {
  try {
    const pagination = listSchema.pick({ limit: true, offset: true }).parse(request.query);
    const where = { author: { followers: { some: { id: request.userId } } } };
    const [articles, articlesCount] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: "desc" },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      prisma.article.count({ where }),
    ]);
    response.json({
      articles: articles.map((article) => toArticleResponse(article, request.userId)),
      articlesCount,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/articles", optionalAuthentication, async (request, response, next) => {
  try {
    const query = listSchema.parse(request.query);
    const where: Prisma.ArticleWhereInput = {
      tags: query.tag ? { some: { name: query.tag } } : undefined,
      author: query.author ? { username: query.author } : undefined,
      favoritedBy: query.favorited
        ? { some: { username: query.favorited } }
        : undefined,
    };
    const [articles, articlesCount] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: "desc" },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.article.count({ where }),
    ]);
    response.json({
      articles: articles.map((article) => toArticleResponse(article, request.userId)),
      articlesCount,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/:slug", optionalAuthentication, async (request, response, next) => {
  try {
    const article = await findArticle(request.params.slug);
    response.json({ article: toArticleResponse(article, request.userId) });
  } catch (error) {
    next(error);
  }
});

router.post("/articles", requireAuthentication, async (request, response, next) => {
  try {
    const { article } = createSchema.parse(request.body);
    const created = await prisma.article.create({
      data: {
        title: article.title,
        slug: createSlug(article.title),
        description: article.description,
        body: article.body,
        authorId: request.userId!,
        tags: {
          connectOrCreate: article.tagList.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: articleInclude,
    });
    response.status(201).json({ article: toArticleResponse(created, request.userId) });
  } catch (error) {
    next(error);
  }
});

router.put("/articles/:slug", requireAuthentication, async (request, response, next) => {
  try {
    const existing = await findArticle(request.params.slug);
    ensureAuthor(existing.authorId, request.userId!);
    const { article } = updateSchema.parse(request.body);
    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: {
        title: article.title,
        slug: article.title ? createSlug(article.title) : undefined,
        description: article.description,
        body: article.body,
        tags: article.tagList
          ? {
              set: [],
              connectOrCreate: article.tagList.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
      include: articleInclude,
    });
    response.json({ article: toArticleResponse(updated, request.userId) });
  } catch (error) {
    next(error);
  }
});

router.delete("/articles/:slug", requireAuthentication, async (request, response, next) => {
  try {
    const article = await findArticle(request.params.slug);
    ensureAuthor(article.authorId, request.userId!);
    await prisma.article.delete({ where: { id: article.id } });
    response.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/articles/:slug/favorite",
  requireAuthentication,
  async (request, response, next) => {
    await changeFavorite(request.params.slug, request.userId!, true)
      .then((article) => response.json({ article: toArticleResponse(article, request.userId) }))
      .catch(next);
  },
);

router.delete(
  "/articles/:slug/favorite",
  requireAuthentication,
  async (request, response, next) => {
    await changeFavorite(request.params.slug, request.userId!, false)
      .then((article) => response.json({ article: toArticleResponse(article, request.userId) }))
      .catch(next);
  },
);

function createSlug(title: string): string {
  return `${slugify(title, { lower: true, strict: true })}-${randomUUID().slice(0, 8)}`;
}

function ensureAuthor(authorId: number, userId: number): void {
  if (authorId !== userId) throw new ApiError(403, { article: ["not owned by user"] });
}

async function changeFavorite(slug: string, userId: number, favorite: boolean) {
  const article = await findArticle(slug);
  return prisma.article.update({
    where: { id: article.id },
    data: {
      favoritedBy: favorite
        ? { connect: { id: userId } }
        : { disconnect: { id: userId } },
    },
    include: articleInclude,
  });
}

export { router as articleRouter };
