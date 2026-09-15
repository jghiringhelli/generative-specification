import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { ArticleService } from '../services/ArticleService';

export class ArticleController {
  public constructor(private readonly articles: ArticleService) {}

  /** Lists filtered articles. */
  public list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.articles.list({
        tag: request.query.tag as string | undefined,
        author: request.query.author as string | undefined,
        favorited: request.query.favorited as string | undefined,
        limit: request.query.limit as unknown as number | undefined,
        offset: request.query.offset as unknown as number | undefined,
        viewerId: request.userId,
      }));
    } catch (error) { next(error); }
  };

  /** Lists articles from followed authors. */
  public feed = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.articles.feed(this.userId(request), request.query.limit as unknown as number, request.query.offset as unknown as number));
    } catch (error) { next(error); }
  };

  /** Returns one article. */
  public get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json({ article: await this.articles.get(request.params.slug, request.userId) }); }
    catch (error) { next(error); }
  };

  /** Creates an article. */
  public create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.status(201).json({ article: await this.articles.create(request.body.article, this.userId(request)) }); }
    catch (error) { next(error); }
  };

  /** Updates an article. */
  public update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json({ article: await this.articles.update(request.params.slug, request.body.article, this.userId(request)) }); }
    catch (error) { next(error); }
  };

  /** Deletes an article. */
  public delete = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { await this.articles.delete(request.params.slug, this.userId(request)); response.sendStatus(204); }
    catch (error) { next(error); }
  };

  /** Favorites an article. */
  public favorite = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json({ article: await this.articles.favorite(request.params.slug, this.userId(request)) }); }
    catch (error) { next(error); }
  };

  /** Unfavorites an article. */
  public unfavorite = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json({ article: await this.articles.unfavorite(request.params.slug, this.userId(request)) }); }
    catch (error) { next(error); }
  };

  private userId(request: Request): string {
    if (!request.userId) throw new UnauthorizedError();
    return request.userId;
  }
}
