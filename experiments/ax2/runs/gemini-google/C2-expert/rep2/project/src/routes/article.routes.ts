import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { articleService } from '../services/article.service';
import { RequestWithUser } from '../types';

const router = Router();

const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'is required'),
    description: z.string().min(1, 'is required'),
    body: z.string().min(1, 'is required'),
    tagList: z.array(z.string()).optional()
  })
});

const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'cannot be empty').optional(),
    description: z.string().min(1, 'cannot be empty').optional(),
    body: z.string().min(1, 'cannot be empty').optional(),
    tagList: z.array(z.string()).optional()
  })
});

/**
 * GET /api/articles/feed - Get articles from followed users
 */
router.get(
  '/articles/feed',
  requireAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await articleService.getFeed(
        req.userId!,
        req.query.limit,
        req.query.offset
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/articles - List articles with filters
 */
router.get(
  '/articles',
  optionalAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        tag: req.query.tag as string | undefined,
        author: req.query.author as string | undefined,
        favorited: req.query.favorited as string | undefined
      };
      const result = await articleService.listArticles(
        filters,
        req.userId,
        req.query.limit,
        req.query.offset
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/articles - Create an article
 */
router.post(
  '/articles',
  requireAuth,
  validateBody(createArticleSchema),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await articleService.createArticle(req.userId!, req.body.article);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/articles/:slug - Get single article
 */
router.get(
  '/articles/:slug',
  optionalAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await articleService.getArticle(req.params.slug, req.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/articles/:slug - Update an article
 */
router.put(
  '/articles/:slug',
  requireAuth,
  validateBody(updateArticleSchema),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await articleService.updateArticle(
        req.params.slug,
        req.userId!,
        req.body.article
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/articles/:slug - Delete an article
 */
router.delete(
  '/articles/:slug',
  requireAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      await articleService.deleteArticle(req.params.slug, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/articles/:slug/favorite - Favorite an article
 */
router.post(
  '/articles/:slug/favorite',
  requireAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await articleService.favoriteArticle(req.params.slug, req.userId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/articles/:slug/favorite - Unfavorite an article
 */
router.delete(
  '/articles/:slug/favorite',
  requireAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await articleService.unfavoriteArticle(req.params.slug, req.userId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
