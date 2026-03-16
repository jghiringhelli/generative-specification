import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ArticleRepository } from '../repositories/articleRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { ArticleService } from '../services/articleService';
import { AuthRequest, authenticateToken, optionalAuth } from '../middleware/auth';
import {
  createArticleSchema,
  updateArticleSchema,
  queryFiltersSchema
} from '../validation/articleSchemas';

const router = Router();
const prisma = new PrismaClient();
const articleRepository = new ArticleRepository(prisma);
const profileRepository = new ProfileRepository(prisma);
const articleService = new ArticleService(articleRepository, profileRepository);

router.get(
  '/articles/feed',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const validated = queryFiltersSchema.parse(req.query);
      const result = await articleService.getFeed(req.userId, {
        limit: validated.limit,
        offset: validated.offset
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/articles/:slug',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const article = await articleService.getArticle(slug, req.userId);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/articles',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = queryFiltersSchema.parse(req.query);
      const result = await articleService.listArticles(
        {
          tag: validated.tag,
          author: validated.author,
          favorited: validated.favorited
        },
        {
          limit: validated.limit,
          offset: validated.offset
        },
        req.userId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/articles',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const validated = createArticleSchema.parse(req.body);
      const article = await articleService.createArticle(
        req.userId,
        validated.article
      );

      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/articles/:slug',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const { slug } = req.params;
      const validated = updateArticleSchema.parse(req.body);
      const article = await articleService.updateArticle(
        slug,
        req.userId,
        validated.article
      );

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/articles/:slug',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const { slug } = req.params;
      await articleService.deleteArticle(slug, req.userId);

      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/articles/:slug/favorite',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const { slug } = req.params;
      const article = await articleService.favoriteArticle(req.userId, slug);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/articles/:slug/favorite',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const { slug } = req.params;
      const article = await articleService.unfavoriteArticle(req.userId, slug);

      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
