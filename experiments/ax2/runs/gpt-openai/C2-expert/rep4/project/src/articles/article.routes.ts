import { Router } from "express";
import { AuthenticatedRequest, optionalAuth, requireAuth } from "../middleware/auth";
import { articleListQuerySchema, createArticleSchema, updateArticleSchema } from "./article.schemas";
import { ArticleService } from "./article.service";

export function createArticleRouter(service: ArticleService, jwtSecret: string): Router {
  const router = Router();

  router.get("/", optionalAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json(await service.list(articleListQuerySchema.parse(request.query), request.userId));
    } catch (error) { next(error); }
  });

  router.get("/feed", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json(await service.feed(articleListQuerySchema.parse(request.query), request.userId!));
    } catch (error) { next(error); }
  });

  router.get("/:slug", optionalAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ article: await service.get(request.params.slug, request.userId) });
    } catch (error) { next(error); }
  });

  router.post("/", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      const input = createArticleSchema.parse(request.body).article;
      response.status(201).json({ article: await service.create(input, request.userId!) });
    } catch (error) { next(error); }
  });

  router.put("/:slug", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      const input = updateArticleSchema.parse(request.body).article;
      response.json({ article: await service.update(request.params.slug, input, request.userId!) });
    } catch (error) { next(error); }
  });

  router.delete("/:slug", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      await service.delete(request.params.slug, request.userId!);
      response.sendStatus(204);
    } catch (error) { next(error); }
  });

  router.post("/:slug/favorite", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ article: await service.favorite(request.params.slug, request.userId!) });
    } catch (error) { next(error); }
  });

  router.delete("/:slug/favorite", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ article: await service.unfavorite(request.params.slug, request.userId!) });
    } catch (error) { next(error); }
  });

  return router;
}
