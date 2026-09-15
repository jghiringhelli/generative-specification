import { Response, NextFunction } from 'express';
import { ArticleService } from '../services/ArticleService';
import { AuthRequest } from '../middleware/auth';
import { CreateArticleSchema, UpdateArticleSchema } from '../dtos/ArticleDTOs';
import { UnauthorizedError } from '../errors/AppError';

export class ArticleController {
  private readonly articleService: ArticleService;

  constructor(articleService: ArticleService) {
    this.articleService = articleService;
  }

  /**
   * Lists articles with optional filters.
   * Route: GET /api/articles
   */
  public listArticles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tag, author, favorited, limit, offset } = req.query;
      const filters = {
        tag: typeof tag === 'string' ? tag : undefined,
        author: typeof author === 'string' ? author : undefined,
        favorited: typeof favorited === 'string' ? favorited : undefined,
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0,
      };

      const result = await this.articleService.listArticles(filters, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves personal article feed from followed authors.
   * Route: GET /api/articles/feed
   */
  public getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { limit, offset } = req.query;
      const pagination = {
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0,
      };

      const result = await this.articleService.getFeed(req.user.id, pagination);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets a single article by slug.
   * Route: GET /api/articles/:slug
   */
  public getArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const result = await this.articleService.getArticle(slug, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates an article.
   * Route: POST /api/articles
   */
  public createArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const validated = CreateArticleSchema.parse(req.body);
      const result = await this.articleService.createArticle(req.user.id, validated.article);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates an existing article.
   * Route: PUT /api/articles/:slug
   */
  public updateArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { slug } = req.params;
      const validated = UpdateArticleSchema.parse(req.body);
      const result = await this.articleService.updateArticle(slug, req.user.id, validated.article);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes an article.
   * Route: DELETE /api/articles/:slug
   */
  public deleteArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { slug } = req.params;
      await this.articleService.deleteArticle(slug, req.user.id);
      res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Favorites an article.
   * Route: POST /api/articles/:slug/favorite
   */
  public favoriteArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { slug } = req.params;
      const result = await this.articleService.favoriteArticle(slug, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unfavorites an article.
   * Route: DELETE /api/articles/:slug/favorite
   */
  public unfavoriteArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { slug } = req.params;
      const result = await this.articleService.unfavoriteArticle(slug, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
