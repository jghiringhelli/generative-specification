// src/controllers/ArticleController.ts
import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/ArticleService';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  public listArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tag, author, favorited, limit, offset } = req.query;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
      const parsedOffset = offset ? parseInt(offset as string, 10) : 0;
      const currentUserId = req.user?.id;

      const result = await this.articleService.listArticles({
        tag: tag as string | undefined,
        author: author as string | undefined,
        favorited: favorited as string | undefined,
        limit: isNaN(parsedLimit) ? 20 : parsedLimit,
        offset: isNaN(parsedOffset) ? 0 : parsedOffset,
        currentUserId
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { limit, offset } = req.query;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
      const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

      const result = await this.articleService.listFeed(
        req.user.id,
        isNaN(parsedLimit) ? 20 : parsedLimit,
        isNaN(parsedOffset) ? 0 : parsedOffset
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public getArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;
      const article = await this.articleService.getArticle(slug, currentUserId);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  public createArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      if (!req.body || !req.body.article) {
        throw new ValidationError('Validation failed', {
          article: ["can't be blank"]
        });
      }

      const { title, description, body, tagList } = req.body.article;
      const article = await this.articleService.createArticle(req.user.id, {
        title,
        description,
        body,
        tagList
      });

      res.status(201).json({ article });
    } catch (err) {
      next(err);
    }
  };

  public updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      if (!req.body || !req.body.article) {
        throw new ValidationError('Validation failed', {
          article: ["can't be blank"]
        });
      }

      const { slug } = req.params;
      const { title, description, body } = req.body.article;
      const article = await this.articleService.updateArticle(req.user.id, slug, {
        title,
        description,
        body
      });

      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  public deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { slug } = req.params;
      await this.articleService.deleteArticle(req.user.id, slug);
      res.status(200).json({ message: 'Article deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  public favoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  public unfavoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
