import { Router, Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/article.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateArticleRequestSchema, UpdateArticleRequestSchema } from '../types/article.types';

export function createArticleRouter(articleService: ArticleService): Router {
  const router = Router();

  /**
   * GET /api/articles - List articles with filters
   * Query params: tag, author, favorited, limit, offset
   */
  router.get(
    '/articles',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { tag, author, favorited, limit, offset } = req.query;
        const currentUserId = req.user?.userId;

        const filters = {
          tag: tag as string | undefined,
          author: author as string | undefined,
          favorited: favorited as string | undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        };

        const result = await articleService.listArticles(filters, currentUserId);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/articles/feed - Get feed from followed users
   * Auth required
   */
  router.get(
    '/articles/feed',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
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
    }
  );

  /**
   * GET /api/articles/:slug - Get single article
   */
  router.get(
    '/articles/:slug',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.userId;

        const result = await articleService.getArticle(slug, currentUserId);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles - Create article
   * Auth required
   */
  router.post(
    '/articles',
    requireAuth,
    validateBody(CreateArticleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { title, description, body, tagList } = req.body.article;
        const authorId = req.user!.userId;

        const result = await articleService.createArticle(
          { title, description, body, tagList },
          authorId
        );
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PUT /api/articles/:slug - Update article
   * Auth required, author only
   */
  router.put(
    '/articles/:slug',
    requireAuth,
    validateBody(UpdateArticleRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const updates = req.body.article;
        const userId = req.user!.userId;

        const result = await articleService.updateArticle(slug, updates, userId);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug - Delete article
   * Auth required, author only
   */
  router.delete(
    '/articles/:slug',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const userId = req.user!.userId;

        await articleService.deleteArticle(slug, userId);
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/favorite - Favorite article
   * Auth required
   */
  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const userId = req.user!.userId;

        const result = await articleService.favoriteArticle(slug, userId);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/favorite - Unfavorite article
   * Auth required
   */
  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const userId = req.user!.userId;

        const result = await articleService.unfavoriteArticle(slug, userId);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
