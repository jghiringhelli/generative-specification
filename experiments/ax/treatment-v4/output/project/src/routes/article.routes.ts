import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ArticleService } from '../services/article.service';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

// Validation schemas
const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title cannot be empty'),
    description: z.string().min(1, 'Description cannot be empty'),
    body: z.string().min(1, 'Body cannot be empty'),
    tagList: z.array(z.string()).optional()
  })
});

const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    body: z.string().min(1, 'Body cannot be empty').optional()
  })
});

/**
 * Article routes factory.
 */
export function createArticleRoutes(articleService: ArticleService): Router {
  const router = Router();

  /**
   * GET /api/articles - List articles with filters
   * Auth optional
   */
  router.get('/articles', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = req.query.tag as string | undefined;
      const author = req.query.author as string | undefined;
      const favorited = req.query.favorited as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const currentUserId = req.user?.id;

      const result = await articleService.listArticles(
        { tag, author, favoritedBy: favorited },
        limit,
        offset,
        currentUserId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/articles/feed - Get feed from followed users
   * Auth required
   */
  router.get('/articles/feed', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const currentUserId = req.user!.id;

      const result = await articleService.getFeed(currentUserId, limit, offset);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/articles/:slug - Get single article
   * Auth optional
   */
  router.get('/articles/:slug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;

      const article = await articleService.getArticle(slug, currentUserId);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/articles - Create article
   * Auth required
   */
  router.post('/articles', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = createArticleSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const article = await articleService.createArticle(result.data.article, req.user!.id);

      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/articles/:slug - Update article
   * Auth required, author only
   */
  router.put('/articles/:slug', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const result = updateArticleSchema.safeParse(req.body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new ValidationError(firstError.message);
      }

      const article = await articleService.updateArticle(slug, result.data.article, req.user!.id);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/articles/:slug - Delete article
   * Auth required, author only
   */
  router.delete('/articles/:slug', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      await articleService.deleteArticle(slug, req.user!.id);

      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/articles/:slug/favorite - Favorite article
   * Auth required
   */
  router.post('/articles/:slug/favorite', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const article = await articleService.favoriteArticle(slug, req.user!.id);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/articles/:slug/favorite - Unfavorite article
   * Auth required
   */
  router.delete('/articles/:slug/favorite', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const article = await articleService.unfavoriteArticle(slug, req.user!.id);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
