import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ArticleService } from '../services/ArticleService';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

/**
 * Article routes (CRUD, favorites, feed).
 * Thin layer: parse input, call service, format response.
 */
export function createArticleRoutes(articleService: ArticleService): Router {
  const router = Router();

  /**
   * GET /api/articles - List articles with filters and pagination
   */
  router.get(
    '/',
    optionalAuthenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filters = {
          tag: req.query.tag as string | undefined,
          author: req.query.author as string | undefined,
          favorited: req.query.favorited as string | undefined
        };

        const pagination = {
          limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
        };

        const currentUserId = req.user?.userId;

        const result = await articleService.listArticles(filters, pagination, currentUserId);

        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/articles/feed - Get feed from followed users (auth required)
   */
  router.get(
    '/feed',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const pagination = {
          limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
        };

        const result = await articleService.getFeed(req.user.userId, pagination);

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
    '/:slug',
    optionalAuthenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.userId;

        const article = await articleService.getArticle(slug, currentUserId);

        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles - Create article (auth required)
   */
  router.post(
    '/',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const schema = z.object({
          article: z.object({
            title: z.string().min(1, 'Title cannot be empty'),
            description: z.string().min(1, 'Description cannot be empty'),
            body: z.string().min(1, 'Body cannot be empty'),
            tagList: z.array(z.string()).optional()
          })
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')} ${e.message}`);
          throw new ValidationError(errors.join(', '));
        }

        const article = await articleService.createArticle(parsed.data.article, req.user.userId);

        res.status(201).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PUT /api/articles/:slug - Update article (auth required, author only)
   */
  router.put(
    '/:slug',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug } = req.params;

        const schema = z.object({
          article: z.object({
            title: z.string().min(1).optional(),
            description: z.string().min(1).optional(),
            body: z.string().min(1).optional()
          })
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')} ${e.message}`);
          throw new ValidationError(errors.join(', '));
        }

        const article = await articleService.updateArticle(
          slug,
          parsed.data.article,
          req.user.userId
        );

        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug - Delete article (auth required, author only)
   */
  router.delete(
    '/:slug',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug } = req.params;

        await articleService.deleteArticle(slug, req.user.userId);

        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/favorite - Favorite article (auth required)
   */
  router.post(
    '/:slug/favorite',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug } = req.params;

        const article = await articleService.favoriteArticle(slug, req.user.userId);

        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/favorite - Unfavorite article (auth required)
   */
  router.delete(
    '/:slug/favorite',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug } = req.params;

        const article = await articleService.unfavoriteArticle(slug, req.user.userId);

        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
