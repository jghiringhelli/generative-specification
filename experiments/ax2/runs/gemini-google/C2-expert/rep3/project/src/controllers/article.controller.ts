import { NextFunction, Request, Response } from 'express';
import { ArticleService } from '../services/article.service';
import { FeedArticlesQuery, ListArticlesQuery } from '../validators/article.validator';

/**
 * Controller handling HTTP requests for articles.
 */
export class ArticleController {
  private readonly articleService: ArticleService;

  /**
   * Initializes ArticleController.
   */
  constructor(articleService: ArticleService = new ArticleService()) {
    this.articleService = articleService;
  }

  /**
   * Handles GET /api/articles
   */
  listArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListArticlesQuery;
      const currentUserId = req.user?.id;
      const result = await this.articleService.listArticles(query, currentUserId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/articles/feed
   */
  listFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as FeedArticlesQuery;
      const currentUserId = req.user!.id;
      const result = await this.articleService.listFeed(currentUserId, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/articles/:slug
   */
  getArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;
      const article = await this.articleService.getArticle(slug, currentUserId);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/articles
   */
  createArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const article = await this.articleService.createArticle(currentUserId, req.body.article);
      res.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT /api/articles/:slug
   */
  updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.id;
      const article = await this.articleService.updateArticle(slug, currentUserId, req.body.article);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/articles/:slug
   */
  deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.id;
      await this.articleService.deleteArticle(slug, currentUserId);
      res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/articles/:slug/favorite
   */
  favoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.id;
      const article = await this.articleService.favoriteArticle(slug, currentUserId);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/articles/:slug/favorite
   */
  unfavoriteArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.id;
      const article = await this.articleService.unfavoriteArticle(slug, currentUserId);
      res.status(200).json({ article });
    } catch (error) {
      next(error);
    }
  };
}
