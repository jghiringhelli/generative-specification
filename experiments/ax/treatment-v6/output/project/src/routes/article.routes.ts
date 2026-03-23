import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ArticleService } from '../services/ArticleService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

/**
 * Creates and returns the articles router.
 * Routes: GET /api/articles, GET /api/articles/feed, GET/POST/PUT/DELETE /api/articles/:slug,
 *         POST/DELETE /api/articles/:slug/favorite
 * @param articleService - Injected article service.
 */
export function createArticleRouter(articleService: ArticleService): Router {
  const router = Router();

  /** GET /api/articles/feed — get articles from followed users (auth required) */
  router.get(
    '/articles/feed',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.getFeed(req.userId!, req.query as Record<string, unknown>);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** GET /api/articles — list articles with optional filters */
  router.get(
    '/articles',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.listArticles(req.query as Record<string, unknown>, req.userId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** POST /api/articles — create a new article */
  router.post(
    '/articles',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.createArticle(req.userId!, req.body.article);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** GET /api/articles/:slug — get a single article */
  router.get(
    '/articles/:slug',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.getArticle(req.params['slug']!, req.userId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** PUT /api/articles/:slug — update an article */
  router.put(
    '/articles/:slug',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.updateArticle(
          req.params['slug']!,
          req.userId!,
          req.body.article,
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** DELETE /api/articles/:slug — delete an article */
  router.delete(
    '/articles/:slug',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await articleService.deleteArticle(req.params['slug']!, req.userId!);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  /** POST /api/articles/:slug/favorite — favorite an article */
  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.favoriteArticle(req.params['slug']!, req.userId!);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** DELETE /api/articles/:slug/favorite — unfavorite an article */
  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.unfavoriteArticle(req.params['slug']!, req.userId!);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
