import { Router, Response, NextFunction } from 'express';
import { ArticleService } from './article.service';
import { createArticleSchema, updateArticleSchema } from './article.schemas';
import { parseOrThrow } from '../../lib/validation';
import { parsePagination } from '../../lib/pagination';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

/**
 * Extracts a string query parameter, ignoring arrays/objects.
 * @param value the raw query value
 * @returns the string value or undefined
 */
function stringParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Builds the articles router. Thin driving adapter: validation + delegation.
 * @param service injected {@link ArticleService}
 * @returns configured Express router
 */
export function createArticleRouter(service: ArticleService): Router {
  const router = Router();

  router.get(
    '/articles/feed',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const pagination = parsePagination(req.query.limit, req.query.offset);
        res.status(200).json(await service.feed(req.user!.id, pagination));
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/articles',
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const pagination = parsePagination(req.query.limit, req.query.offset);
        const params = {
          ...pagination,
          tag: stringParam(req.query.tag),
          author: stringParam(req.query.author),
          favorited: stringParam(req.query.favorited)
        };
        res.status(200).json(await service.list(params, req.user?.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/articles/:slug',
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.getBySlug(req.params.slug, req.user?.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/articles',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const input = parseOrThrow(createArticleSchema, req.body).article;
        res.status(201).json(await service.create(input, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    '/articles/:slug',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const input = parseOrThrow(updateArticleSchema, req.body).article;
        res.status(200).json(await service.update(req.params.slug, input, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/articles/:slug',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        await service.delete(req.params.slug, req.user!.id);
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.favorite(req.params.slug, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.unfavorite(req.params.slug, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
