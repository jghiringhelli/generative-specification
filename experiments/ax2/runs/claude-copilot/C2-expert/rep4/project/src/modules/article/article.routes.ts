import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { UserRepository } from "../user/user.repository";
import { ArticleRepository } from "./article.repository";
import { ArticleService } from "./article.service";
import {
  createArticleSchema,
  feedQuerySchema,
  listQuerySchema,
  updateArticleSchema,
} from "./article.schemas";

/**
 * Build the article router.
 * @param service Injected article service.
 * @returns An Express router for article endpoints.
 */
export function createArticleRouter(service: ArticleService): Router {
  const router = Router();

  router.get(
    "/articles/feed",
    requireAuth,
    asyncHandler(async (req, res) => {
      const query = validate(feedQuerySchema, req.query);
      res.status(200).json(await service.feed(query, req.user!.id));
    }),
  );

  router.get(
    "/articles",
    optionalAuth,
    asyncHandler(async (req, res) => {
      const query = validate(listQuerySchema, req.query);
      res.status(200).json(await service.list(query, req.user?.id));
    }),
  );

  router.get(
    "/articles/:slug",
    optionalAuth,
    asyncHandler(async (req, res) => {
      res
        .status(200)
        .json(await service.get(req.params.slug, req.user?.id));
    }),
  );

  router.post(
    "/articles",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { article } = validate(createArticleSchema, req.body);
      res.status(201).json(await service.create(article, req.user!.id));
    }),
  );

  router.put(
    "/articles/:slug",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { article } = validate(updateArticleSchema, req.body);
      res
        .status(200)
        .json(await service.update(req.params.slug, article, req.user!.id));
    }),
  );

  router.delete(
    "/articles/:slug",
    requireAuth,
    asyncHandler(async (req, res) => {
      await service.delete(req.params.slug, req.user!.id);
      res.status(200).json({});
    }),
  );

  router.post(
    "/articles/:slug/favorite",
    requireAuth,
    asyncHandler(async (req, res) => {
      res
        .status(200)
        .json(await service.favorite(req.params.slug, req.user!.id));
    }),
  );

  router.delete(
    "/articles/:slug/favorite",
    requireAuth,
    asyncHandler(async (req, res) => {
      res
        .status(200)
        .json(await service.unfavorite(req.params.slug, req.user!.id));
    }),
  );

  return router;
}

/** Default composition helper wiring repositories into the service. */
export function buildArticleModule(): ArticleService {
  return new ArticleService(new ArticleRepository(), new UserRepository());
}
