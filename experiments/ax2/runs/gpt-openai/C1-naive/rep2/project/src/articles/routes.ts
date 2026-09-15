import { Router } from "express";
import { optionalAuthentication, requireAuthentication } from "../auth/middleware";
import {
  createArticle,
  deleteArticle,
  favoriteArticle,
  getArticle,
  getArticleFeed,
  listArticles,
  unfavoriteArticle,
  updateArticle,
} from "./service";

export const articleRouter = Router();

articleRouter.get("/articles", optionalAuthentication, async (request, response, next) => {
  try {
    response.json(await listArticles(request.query as Record<string, string>, request.userId));
  } catch (error) {
    next(error);
  }
});

articleRouter.get("/articles/feed", requireAuthentication, async (request, response, next) => {
  try {
    response.json(await getArticleFeed(request.query as Record<string, string>, request.userId!));
  } catch (error) {
    next(error);
  }
});

articleRouter.get("/articles/:slug", optionalAuthentication, async (request, response, next) => {
  try {
    response.json({ article: await getArticle(request.params.slug, request.userId) });
  } catch (error) {
    next(error);
  }
});

articleRouter.post("/articles", requireAuthentication, async (request, response, next) => {
  try {
    const article = await createArticle(request.body.article ?? {}, request.userId!);
    response.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

articleRouter.put("/articles/:slug", requireAuthentication, async (request, response, next) => {
  try {
    response.json({ article: await updateArticle(request.params.slug, request.body.article ?? {}, request.userId!) });
  } catch (error) {
    next(error);
  }
});

articleRouter.delete("/articles/:slug", requireAuthentication, async (request, response, next) => {
  try {
    await deleteArticle(request.params.slug, request.userId!);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

articleRouter.post("/articles/:slug/favorite", requireAuthentication, async (request, response, next) => {
  try {
    response.json({ article: await favoriteArticle(request.params.slug, request.userId!) });
  } catch (error) {
    next(error);
  }
});

articleRouter.delete("/articles/:slug/favorite", requireAuthentication, async (request, response, next) => {
  try {
    response.json({ article: await unfavoriteArticle(request.params.slug, request.userId!) });
  } catch (error) {
    next(error);
  }
});
