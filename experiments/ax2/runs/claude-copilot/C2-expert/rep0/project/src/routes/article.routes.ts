import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import type { ArticleService } from '../services/article.service';
import {
  optionalAuth,
  requireAuth,
  type AuthenticatedRequest
} from '../middleware/auth';

/**
 * Builds the router for article listing, CRUD, feed and favorite endpoints.
 * @param articleService The article service to delegate to.
 * @param jwtSecret The signing secret for the auth middleware.
 * @returns The configured Express router.
 */
export function createArticleRouter(
  articleService: ArticleService,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);
  const maybeAuth = optionalAuth(jwtSecret);

  router.get(
    '/feed',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.getFeed(
          req.query,
          req.userId as number
        );
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/',
    maybeAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await articleService.listArticles(
          req.query,
          req.userId
        );
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.createArticle(
          req.body,
          req.userId as number
        );
        res.status(201).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:slug',
    maybeAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.getArticle(
          req.params.slug,
          req.userId
        );
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    '/:slug',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.updateArticle(
          req.params.slug,
          req.body,
          req.userId as number
        );
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:slug',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        await articleService.deleteArticle(
          req.params.slug,
          req.userId as number
        );
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/:slug/favorite',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.favoriteArticle(
          req.params.slug,
          req.userId as number
        );
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:slug/favorite',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.unfavoriteArticle(
          req.params.slug,
          req.userId as number
        );
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
