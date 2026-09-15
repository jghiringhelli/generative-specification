import { Router } from "express";
import {
  AuthenticatedRequest,
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from "../middleware/auth";
import { ArticleService } from "./article.service";
import { articleListSchema, createArticleSchema, updateArticleSchema } from "./article.schemas";

/** Creates article listing, mutation, and favorite routes. */
export function createArticleRouter(service: ArticleService, jwtSecret: string): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(jwtSecret);
  const optionalAuthenticate = createOptionalAuthMiddleware(jwtSecret);

  router.get("/articles", optionalAuthenticate, async (request, response, next) => {
    try {
      const userId = (request as Partial<AuthenticatedRequest>).userId;
      response.json(await service.list(articleListSchema.parse(request.query), userId));
    } catch (error) { next(error); }
  });

  router.get("/articles/feed", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      response.json(await service.feed(articleListSchema.parse(request.query), userId));
    } catch (error) { next(error); }
  });

  router.get("/articles/:slug", optionalAuthenticate, async (request, response, next) => {
    try {
      const userId = (request as Partial<AuthenticatedRequest>).userId;
      response.json({ article: await service.get(request.params.slug, userId) });
    } catch (error) { next(error); }
  });

  router.post("/articles", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      const data = createArticleSchema.parse(request.body).article;
      response.status(201).json({ article: await service.create(data, userId) });
    } catch (error) { next(error); }
  });

  router.put("/articles/:slug", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      const data = updateArticleSchema.parse(request.body).article;
      response.json({ article: await service.update(request.params.slug, data, userId) });
    } catch (error) { next(error); }
  });

  router.delete("/articles/:slug", authenticate, async (request, response, next) => {
    try {
      await service.delete(request.params.slug, (request as AuthenticatedRequest).userId);
      response.sendStatus(204);
    } catch (error) { next(error); }
  });

  router.post("/articles/:slug/favorite", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      response.json({ article: await service.favorite(request.params.slug, userId) });
    } catch (error) { next(error); }
  });

  router.delete("/articles/:slug/favorite", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      response.json({ article: await service.unfavorite(request.params.slug, userId) });
    } catch (error) { next(error); }
  });

  return router;
}
