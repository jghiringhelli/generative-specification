import { Prisma } from "@prisma/client";
import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../auth";
import {
  articleInclude,
  createSlug,
  serializeArticle,
} from "../article-utils";
import { prisma } from "../prisma";

export const articlesRouter = Router();

articlesRouter.get("/articles/feed", authenticate, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);
    const articles = await prisma.article.findMany({
      where: { author: { followers: { some: { followerId: req.userId } } } },
      include: articleInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    const articlesCount = await prisma.article.count({
      where: { author: { followers: { some: { followerId: req.userId } } } },
    });
    res.json({
      articles: await Promise.all(articles.map((article) => serializeArticle(article, req.userId))),
      articlesCount,
    });
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/articles", optionalAuthenticate, async (req, res, next) => {
  try {
    const where: Prisma.ArticleWhereInput = {};
    if (typeof req.query.tag === "string") {
      where.tags = { some: { name: req.query.tag } };
    }
    if (typeof req.query.author === "string") {
      where.author = { username: req.query.author };
    }
    if (typeof req.query.favorited === "string") {
      where.favorites = { some: { user: { username: req.query.favorited } } };
    }

    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);
    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.article.count({ where }),
    ]);
    res.json({
      articles: await Promise.all(articles.map((article) => serializeArticle(article, req.userId))),
      articlesCount,
    });
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/articles/:slug", optionalAuthenticate, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: req.params.slug },
      include: articleInclude,
    });
    if (!article) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    res.json({ article: await serializeArticle(article, req.userId) });
  } catch (error) {
    next(error);
  }
});

articlesRouter.post("/articles", authenticate, async (req, res, next) => {
  try {
    const { title, description, body, tagList = [] } = req.body.article ?? {};
    if (!title || !description || !body) {
      res.status(422).json({ errors: { body: ["title, description and body are required"] } });
      return;
    }

    const article = await prisma.article.create({
      data: {
        title,
        description,
        body,
        slug: createSlug(title),
        authorId: req.userId!,
        tags: {
          connectOrCreate: tagList.map((name: string) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: articleInclude,
    });
    res.status(201).json({ article: await serializeArticle(article, req.userId) });
  } catch (error) {
    next(error);
  }
});

articlesRouter.put("/articles/:slug", authenticate, async (req, res, next) => {
  try {
    const current = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!current) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    if (current.authorId !== req.userId) {
      res.status(403).json({ errors: { body: ["Forbidden"] } });
      return;
    }

    const input = req.body.article ?? {};
    const article = await prisma.article.update({
      where: { id: current.id },
      data: {
        title: input.title,
        description: input.description,
        body: input.body,
        slug: input.title ? createSlug(input.title) : undefined,
        tags: input.tagList
          ? {
              set: [],
              connectOrCreate: input.tagList.map((name: string) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
      include: articleInclude,
    });
    res.json({ article: await serializeArticle(article, req.userId) });
  } catch (error) {
    next(error);
  }
});

articlesRouter.delete("/articles/:slug", authenticate, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    if (article.authorId !== req.userId) {
      res.status(403).json({ errors: { body: ["Forbidden"] } });
      return;
    }
    await prisma.article.delete({ where: { id: article.id } });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

articlesRouter.post("/articles/:slug/favorite", authenticate, async (req, res, next) => {
  try {
    const found = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!found) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    await prisma.favorite.upsert({
      where: { userId_articleId: { userId: req.userId!, articleId: found.id } },
      create: { userId: req.userId!, articleId: found.id },
      update: {},
    });
    const article = await prisma.article.findUniqueOrThrow({
      where: { id: found.id },
      include: articleInclude,
    });
    res.json({ article: await serializeArticle(article, req.userId) });
  } catch (error) {
    next(error);
  }
});

articlesRouter.delete("/articles/:slug/favorite", authenticate, async (req, res, next) => {
  try {
    const found = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!found) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    await prisma.favorite.deleteMany({
      where: { userId: req.userId, articleId: found.id },
    });
    const article = await prisma.article.findUniqueOrThrow({
      where: { id: found.id },
      include: articleInclude,
    });
    res.json({ article: await serializeArticle(article, req.userId) });
  } catch (error) {
    next(error);
  }
});
