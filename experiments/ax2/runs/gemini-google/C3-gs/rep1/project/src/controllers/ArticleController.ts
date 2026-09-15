import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/ArticleService';
import {
  articleFeedQuerySchema,
  articleQuerySchema,
  createArticleSchema,
  updateArticleSchema,
} from '../validators/article.validator';
import { UnauthorizedError } from '../errors/AppError';

export class ArticleController {
  private readonly articleService: ArticleService;

  constructor(articleService: ArticleService) {
    this.articleService = articleService;
  }

  listArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = articleQuerySchema.parse(req.query);
      const result = await this.articleService.listArticles(query, req.user?.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  feedArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const query = articleFeedQuerySchema.parse(req.query);
      const result = await this.articleService.feedArticles(query, req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const article = await this.articleService.getArticle(slug, req.user?.id);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  createArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const parsed = createArticleSchema.parse(req.body);
      const article = await this.articleService.createArticle(parsed.article, req.user.id);
      res.status(201).json({ article });
    } catch (err) {
      next(err);
    }
  };

  updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { slug } = req.params;
      const parsed = updateArticleSchema.parse(req.body);
      const article = await this.articleService.updateArticle(
        slug,
        parsed.article,
        req.user.id
      );
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { slug } = req.params;
      await this.articleService.deleteArticle(slug, req.user.id);
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  };

  favoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { slug } = req.params;
      const article = await this.articleService.favoriteArticle(slug, req.user.id);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };

  unfavoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { slug } = req.params;
      const article = await this.articleService.unfavoriteArticle(slug, req.user.id);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  };
}
