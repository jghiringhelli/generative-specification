import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IArticleService, ArticleService } from '../services/article.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { HTTP_STATUS } from '../config/constants';
import { UnauthorizedError } from '../utils/error.util';

const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    body: z.string().min(1, 'Body is required'),
    tagList: z.array(z.string()).optional()
  })
});

const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    body: z.string().min(1, 'Body cannot be empty').optional(),
    tagList: z.array(z.string()).optional()
  })
});

/**
 * Creates the article endpoints router.
 */
export function createArticleRouter(
  articleService: IArticleService = new ArticleService()
): Router {
  const router = Router();

  // GET /api/articles
  router.get(
    '/articles',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const filters = {
          tag: typeof req.query.tag === 'string' ? req.query.tag : undefined,
          author: typeof req.query.author === 'string' ? req.query.author : undefined,
          favorited: typeof req.query.favorited === 'string' ? req.query.favorited : undefined,
          limit: req.query.limit,
          offset: req.query.offset
        };
        const result = await articleService.listArticles(filters, req.user?.id);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/articles/feed (MUST BE REGISTERED BEFORE /:slug)
  router.get(
    '/articles/feed',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const result = await articleService.getFeed(req.user.id, req.query.limit, req.query.offset);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/articles/:slug
  router.get(
    '/articles/:slug',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await articleService.getArticle(req.params.slug, req.user?.id);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/articles
  router.post(
    '/articles',
    requireAuth,
    validateBody(createArticleSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const result = await articleService.createArticle(req.user.id, req.body.article);
        res.status(HTTP_STATUS.CREATED).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/articles/:slug
  router.put(
    '/articles/:slug',
    requireAuth,
    validateBody(updateArticleSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const result = await articleService.updateArticle(
          req.params.slug,
          req.user.id,
          req.body.article
        );
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/articles/:slug
  router.delete(
    '/articles/:slug',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        await articleService.deleteArticle(req.params.slug, req.user.id);
        res.status(HTTP_STATUS.OK).json({ message: 'Article successfully deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/articles/:slug/favorite
  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const result = await articleService.favoriteArticle(req.params.slug, req.user.id);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/articles/:slug/favorite
  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const result = await articleService.unfavoriteArticle(req.params.slug, req.user.id);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
