
/**
 * Article route handlers.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/article.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { createArticleSchema, updateArticleSchema } from '../validators/article.validator';
import { ValidationError } from '../errors/AppError';

export function createArticleRoutes(articleService: ArticleService): Router {
  const router = Router();

  /**
   * GET /api/articles — List articles (auth optional)
   */
  router.get('/articles', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tag, author, favorited, limit, offset } = req.query;
      const currentUserId = req.user?.userId ?? null;

      const result = await articleService.listArticles(
        {
          tag: tag as string | undefined,
          author: author as string | undefined,
          favorited: favorited as string | undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined
        },
        currentUserId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/articles/feed — Get feed (auth required)
   */
  router.get('/articles/feed', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset } = req.query;
      const currentUserId = req.user!.userId;

      const result = await articleService.getFeed(
        currentUserId,
        limit ? parseInt(limit as string, 10) : undefined,
        offset ? parseInt(offset as string, 10) : undefined
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/articles/:slug — Get single article (auth optional)
   */
  router.get('/articles/:slug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.userId ?? null;

      const article = await articleService.getArticle(slug, currentUserId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/articles — Create article (auth required)
   */
  router.post('/articles', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = createArticleSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const currentUserId = req.user!.userId;
      const { title, description, body, tagList } = parseResult.data.article;

      const article = await articleService.createArticle(
        { title, description, body, tagList },
        currentUserId
      );

      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/articles/:slug — Update article (auth required)
   */
  router.put('/articles/:slug', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = updateArticleSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const { slug } = req.params;
      const currentUserId = req.user!.userId;
      const updates = parseResult.data.article;

      const article = await articleService.updateArticle(slug, updates, currentUserId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/articles/:slug — Delete article (auth required)
   */
  router.delete('/articles/:slug', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.userId;

      await articleService.deleteArticle(slug, currentUserId);

      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/articles/:slug/favorite — Favorite article (auth required)
   */
  router.post('/articles/:slug/favorite', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.userId;

      const article = await articleService.favoriteArticle(slug, currentUserId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/articles/:slug/favorite — Unfavorite article (auth required)
   */
  router.delete('/articles/:slug/favorite', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.userId;

      const article = await articleService.unfavoriteArticle(slug, currentUserId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
