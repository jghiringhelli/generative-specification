import { Router } from "express";
import {
  AuthenticatedRequest,
  optionalAuth,
  requireAuth
} from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { validateQuery } from "../middleware/validate-query.middleware";
import {
  articleListQuerySchema,
  articlePaginationSchema,
  createArticleSchema,
  updateArticleSchema
} from "./article.schemas";
import { ArticleService } from "./article.service";

/** Creates article CRUD, feed, and favorite routes. */
export function createArticleRouter(service: ArticleService, jwtSecret: string): Router {
  const router = Router();
  const required = requireAuth(jwtSecret);
  const optional = optionalAuth(jwtSecret);

  router.get(
    "/articles",
    optional,
    validateQuery(articleListQuerySchema),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json(await service.list(response.locals.validatedQuery, request.userId));
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/articles/feed",
    required,
    validateQuery(articlePaginationSchema),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json(
          await service.listFeed(request.userId!, response.locals.validatedQuery)
        );
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/articles/:slug",
    optional,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          article: await service.get(request.params.slug, request.userId)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/articles",
    required,
    validateBody(createArticleSchema),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.status(201).json({
          article: await service.create(request.userId!, request.body.article)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    "/articles/:slug",
    required,
    validateBody(updateArticleSchema),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          article: await service.update(
            request.params.slug,
            request.userId!,
            request.body.article
          )
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/articles/:slug",
    required,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        await service.delete(request.params.slug, request.userId!);
        response.sendStatus(204);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/articles/:slug/favorite",
    required,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          article: await service.favorite(request.params.slug, request.userId!)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/articles/:slug/favorite",
    required,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          article: await service.unfavorite(request.params.slug, request.userId!)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
