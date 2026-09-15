import { NextFunction, Request, Response, Router } from 'express';
import { createAuthenticationMiddleware } from '../http/auth.middleware';
import { createOptionalAuthenticationMiddleware } from '../http/optional-auth.middleware';
import { AuthenticatedRequest } from '../http/request';
import { ArticleService } from './article.service';
import { articleListSchema, createArticleSchema, updateArticleSchema } from './article.schemas';

/** Creates article routes. */
export function createArticleRouter(service: ArticleService, jwtSecret: string): Router {
  const router = Router();
  const required = createAuthenticationMiddleware(jwtSecret);
  const optional = createOptionalAuthenticationMiddleware(jwtSecret);

  router.get('/articles', optional, listHandler(service));
  router.get('/articles/feed', required, feedHandler(service));
  router.get('/articles/:slug', optional, articleHandler((request) =>
    service.get(request.params.slug, optionalUserId(request))));
  router.post('/articles', required, articleHandler((request) => {
    const { article } = createArticleSchema.parse(request.body);
    return service.create(userId(request), article);
  }));
  router.put('/articles/:slug', required, articleHandler((request) => {
    const { article } = updateArticleSchema.parse(request.body);
    return service.update(request.params.slug, userId(request), article);
  }));
  router.delete('/articles/:slug', required, deleteHandler(service));
  router.post('/articles/:slug/favorite', required, articleHandler((request) =>
    service.favorite(request.params.slug, userId(request))));
  router.delete('/articles/:slug/favorite', required, articleHandler((request) =>
    service.unfavorite(request.params.slug, userId(request))));
  return router;
}

function listHandler(service: ArticleService) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await service.list(articleListSchema.parse(request.query), optionalUserId(request)));
    } catch (error) { next(error); }
  };
}

function feedHandler(service: ArticleService) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = articleListSchema.pick({ limit: true, offset: true }).parse(request.query);
      response.json(await service.feed(userId(request), query.limit, query.offset));
    } catch (error) { next(error); }
  };
}

function articleHandler(operation: (request: Request) => Promise<unknown>) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json({ article: await operation(request) }); } catch (error) { next(error); }
  };
}

function deleteHandler(service: ArticleService) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { await service.delete(request.params.slug, userId(request)); response.sendStatus(200); }
    catch (error) { next(error); }
  };
}

function userId(request: Request): number {
  return (request as AuthenticatedRequest).userId;
}

function optionalUserId(request: Request): number | undefined {
  return (request as Partial<AuthenticatedRequest>).userId;
}
