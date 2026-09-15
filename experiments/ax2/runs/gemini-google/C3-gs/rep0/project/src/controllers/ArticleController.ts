// src/controllers/ArticleController.ts
import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/ArticleService';
import { UnauthorizedError, ValidationError } from '../errors/AppError';

export class ArticleController {
  private articleService: ArticleService;

  constructor(articleService: ArticleService) {
    this.articleService = articleService;
  }

  listArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tag, author, favorited, limit, offset } = req.query;
      const currentUserId = req.user?.id;

      const result = await this.articleService.listArticles(
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
    } catch (err) {
      next(err);
    }
  };

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { limit, offset } = req.query;
      const result = await this.articleService.getFeed(req.user.id, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;
      const article = await this.articleService.getArticle(slug, currentUserId);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  createArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const articleData = req.body?.article;
      if (!articleData) {
        throw new ValidationError({ article: ["can't be blank"] });
      }

      const article = await this.articleService.createArticle(req.user.id, articleData);
      res.status(201).json({ article });
    } catch (err) {
      next(err);
    }
  };

  updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { slug } = req.params;
      const articleData = req.body?.article;
      if (!articleData) {
        throw new ValidationError({ article: ["can't be blank"] });
      }

      const article = await this.articleService.updateArticle(slug, req.user.id, articleData);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { slug } = req.params;
      await this.articleService.deleteArticle(slug, req.user.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  favoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { slug } = req.params;
      const article = await this.articleService.favoriteArticle(req.user.id, slug);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  unfavoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { slug } = req.params;
      const article = await this.articleService.unfavoriteArticle(req.user.id, slug);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };
}
