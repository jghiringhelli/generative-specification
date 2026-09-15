import { Router, Response, NextFunction } from 'express';
import {
  ArticleService,
  CreateArticleInputSchema,
  UpdateArticleInputSchema,
  PaginationQuerySchema,
} from '../services/article-service';
import {
  requireAuth,
  optionalAuth,
  AuthenticatedRequest,
} from '../middleware/auth';
import { UnauthorizedError } from '../errors/http-error';

const router = Router();
const articleService = new ArticleService();

/**
 * GET /api/articles/feed - Get recent articles from followed users
 */
router.get(
  '/articles/feed',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const query = PaginationQuerySchema.parse(req.query);
      const result = await articleService.getFeed(req.user.userId, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/articles - List articles with filters and pagination
 */
router.get(
  '/articles',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = PaginationQuerySchema.parse(req.query);
      const result = await articleService.listArticles(query, req.user?.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/articles/:slug - Get an article
 */
router.get(
  '/articles/:slug',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const article = await articleService.getArticle(slug, req.user?.userId);
      res.status(200).json({ article });
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const validatedInput = CreateArticleInputSchema.parse(req.body);
      const article = await articleService.createArticle(validatedInput, req.user.userId);
      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/articles/:slug - Update an article (author only)
 */
router.put(
  '/articles/:slug',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { slug } = req.params;
      const validatedInput = UpdateArticleInputSchema.parse(req.body);
      const article = await articleService.updateArticle(slug, validatedInput, req.user.userId);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/articles/:slug - Delete an article (author only)
 */
router.delete(
  '/articles/:slug',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { slug } = req.params;
      await articleService.deleteArticle(slug, req.user.userId);
      res.status(200).json({ message: 'Article deleted successfully' });
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
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
 * DELETE /api/articles/:slug/favorite - Unfavorite an article
 */
router.delete(
  '/articles/:slug/favorite',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { slug } = req.params;
      const article = await articleService.unfavoriteArticle(slug, req.user.userId);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

export const articleRouter = router;
