import { Response, NextFunction } from 'express';
import { ArticleService } from '../services/ArticleService';
import { RequestWithUser } from '../middleware/auth';
import { UnauthorizedError, ValidationError } from '../errors/AppError';

export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /**
   * Lists articles according to query filters without body.
   */
  async listArticles(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tag, author, favorited, limit, offset } = req.query;
      const result = await this.articleService.listArticles(
        {
          tag: typeof tag === 'string' ? tag : undefined,
          author: typeof author === 'string' ? author : undefined,
          favorited: typeof favorited === 'string' ? favorited : undefined,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined
        },
        req.user?.id
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves personal article feed for the authenticated user without body.
   */
  async getFeed(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { limit, offset } = req.query;
      const result = await this.articleService.getFeed(
        req.user.id,
        limit ? Number(limit) : undefined,
        offset ? Number(offset) : undefined
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves single article by slug including body.
   */
  async getArticle(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const article = await this.articleService.getArticle(req.params.slug, req.user?.id);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Creates an article.
   */
  async createArticle(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!req.body || !req.body.article) {
        throw new ValidationError({ body: ["'article' object is required"] });
      }
      const article = await this.articleService.createArticle(req.user.id, req.body.article);
      res.status(201).json({ article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates an article by slug (author only).
   */
  async updateArticle(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!req.body || !req.body.article) {
        throw new ValidationError({ body: ["'article' object is required"] });
      }
      const article = await this.articleService.updateArticle(
        req.user.id,
        req.params.slug,
        req.body.article
      );
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Deletes an article by slug (author only).
   */
  async deleteArticle(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await this.articleService.deleteArticle(req.user.id, req.params.slug);
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  }

  /**
   * Favorites an article by slug.
   */
  async favoriteArticle(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const article = await this.articleService.favoriteArticle(req.user.id, req.params.slug);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unfavorites an article by slug.
   */
  async unfavoriteArticle(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const article = await this.articleService.unfavoriteArticle(req.user.id, req.params.slug);
      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }
}
