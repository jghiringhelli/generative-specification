import { Router } from 'express';
import { ArticleService } from '../services/article.service';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { resolvePagination, Pagination } from '../utils/pagination';
import { ValidationError } from '../utils/errors';
import { createArticleSchema, updateArticleSchema } from '../validators/article.schemas';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parsePagination(query: Record<string, unknown>): Pagination {
  try {
    return resolvePagination(query.limit, query.offset);
  } catch (error) {
    throw new ValidationError([(error as Error).message]);
  }
}

/**
 * Builds the articles router.
 * @param articleService the injected article service.
 * @returns an Express router.
 */
export function createArticleRouter(articleService: ArticleService): Router {
  const router = Router();

  router.get(
    '/articles/feed',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const result = await articleService.feed(req.user!.id, pagination);
      res.status(200).json(result);
    })
  );

  router.get(
    '/articles',
    optionalAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const result = await articleService.list(
        {
          tag: asString(req.query.tag),
          author: asString(req.query.author),
          favorited: asString(req.query.favorited),
          pagination
        },
        req.user?.id
      );
      res.status(200).json(result);
    })
  );

  router.get(
    '/articles/:slug',
    optionalAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const article = await articleService.getBySlug(req.params.slug, req.user?.id);
      res.status(200).json({ article });
    })
  );

  router.post(
    '/articles',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { article } = createArticleSchema.parse(req.body);
      const created = await articleService.create(article, req.user!.id);
      res.status(201).json({ article: created });
    })
  );

  router.put(
    '/articles/:slug',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { article } = updateArticleSchema.parse(req.body);
      const updated = await articleService.update(req.params.slug, article, req.user!.id);
      res.status(200).json({ article: updated });
    })
  );

  router.delete(
    '/articles/:slug',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      await articleService.delete(req.params.slug, req.user!.id);
      res.status(200).json({});
    })
  );

  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const article = await articleService.favorite(req.params.slug, req.user!.id);
      res.status(200).json({ article });
    })
  );

  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const article = await articleService.unfavorite(req.params.slug, req.user!.id);
      res.status(200).json({ article });
    })
  );

  return router;
}
