import { Router, Request, Response, NextFunction } from 'express';
import { ArticleService } from './article.service';
import { createCommentsRouter } from '../comments/comment.routes';
import {
  createArticleSchema,
  updateArticleSchema,
  articlesQuerySchema,
  feedQuerySchema
} from './article.dto';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';

export function createArticlesRouter(articleService: ArticleService = new ArticleService()): Router {
  const router = Router();

  // Mount nested comments router
  router.use('/:slug/comments', createCommentsRouter());

  // GET /api/articles/feed (MUST come before /:slug)
  router.get(
    '/feed',
    requireAuth,
    validateQuery(feedQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.query as any;
        const result = await articleService.getFeed(req.user!.id, query);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/articles (list with filters)
  router.get(
    '/',
    optionalAuth,
    validateQuery(articlesQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.query as any;
        const result = await articleService.listArticles(query, req.user?.id);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/articles (create article)
  router.post(
    '/',
    requireAuth,
    validateBody(createArticleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.createArticle(req.user!.id, req.body);
        res.status(201).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/articles/:slug
  router.get(
    '/:slug',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.getArticle(req.params.slug, req.user?.id);
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/articles/:slug
  router.put(
    '/:slug',
    requireAuth,
    validateBody(updateArticleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.updateArticle(
          req.params.slug,
          req.user!.id,
          req.body
        );
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/articles/:slug
  router.delete(
    '/:slug',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await articleService.deleteArticle(req.params.slug, req.user!.id);
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/articles/:slug/favorite
  router.post(
    '/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.favoriteArticle(req.params.slug, req.user!.id);
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/articles/:slug/favorite
  router.delete(
    '/:slug/favorite',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const article = await articleService.unfavoriteArticle(req.params.slug, req.user!.id);
        res.status(200).json({ article });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
