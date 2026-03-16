import { Router, Response } from 'express';
import { ArticleService } from '../services/article.service';
import { AuthService } from '../services/auth.service';
import {
  AuthenticatedRequest,
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from '../middleware/auth.middleware';
import { ValidationError } from '../errors';
import { createArticleSchema, updateArticleSchema } from '../validation/article.schemas';

/**
 * Create article routes.
 */
export function createArticleRoutes(
  articleService: ArticleService,
  authService: AuthService
): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);
  const optionalAuth = createOptionalAuthMiddleware(authService);

  /**
   * GET /api/articles - List articles
   */
  router.get('/articles', optionalAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const filters = {
        tag: req.query.tag as string | undefined,
        author: req.query.author as string | undefined,
        favorited: req.query.favorited as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      };

      const result = await articleService.listArticles(filters, req.userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/articles/feed - Get feed
   */
  router.get('/articles/feed', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await articleService.getFeed(req.userId!, limit, offset);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/articles/:slug - Get single article
   */
  router.get('/articles/:slug', optionalAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { slug } = req.params;
      const article = await articleService.getArticle(slug, req.userId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/articles - Create article
   */
  router.post('/articles', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = createArticleSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const article = await articleService.createArticle(
        result.data.article,
        req.userId!
      );

      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/articles/:slug - Update article
   */
  router.put('/articles/:slug', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = updateArticleSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const { slug } = req.params;
      const article = await articleService.updateArticle(
        slug,
        result.data.article,
        req.userId!
      );

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/articles/:slug - Delete article
   */
  router.delete('/articles/:slug', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { slug } = req.params;
      await articleService.deleteArticle(slug, req.userId!);

      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/articles/:slug/favorite - Favorite article
   */
  router.post('/articles/:slug/favorite', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { slug } = req.params;
      const article = await articleService.favoriteArticle(slug, req.userId!);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/articles/:slug/favorite - Unfavorite article
   */
  router.delete('/articles/:slug/favorite', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { slug } = req.params;
      const article = await articleService.unfavoriteArticle(slug, req.userId!);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
