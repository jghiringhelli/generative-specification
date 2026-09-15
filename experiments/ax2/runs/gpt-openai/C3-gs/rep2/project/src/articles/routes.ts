import { Router } from 'express';
import { TokenService } from '../auth/ports';
import { UnauthorizedError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { ArticleService } from './ArticleService';
import {
  articleListQuerySchema,
  createArticleSchema,
  feedQuerySchema,
  updateArticleSchema,
} from './validation';

function userId(value: string | undefined): string {
  if (!value) {
    throw new UnauthorizedError('Authentication is required');
  }
  return value;
}

/** Creates article API routes. */
export function createArticleRouter(articles: ArticleService, tokens: TokenService): Router {
  const router = Router();

  router.get('/', optionalAuth(tokens), asyncHandler(async (request, response) => {
    const query = articleListQuerySchema.parse(request.query);
    response.json(await articles.list(query, request.userId));
  }));

  router.get('/feed', requireAuth(tokens), asyncHandler(async (request, response) => {
    const query = feedQuerySchema.parse(request.query);
    response.json(await articles.feed(userId(request.userId), query.limit, query.offset));
  }));

  router.get('/:slug', optionalAuth(tokens), asyncHandler(async (request, response) => {
    response.json({ article: await articles.get(request.params.slug, request.userId) });
  }));

  router.post('/', requireAuth(tokens), asyncHandler(async (request, response) => {
    const { article } = createArticleSchema.parse(request.body);
    response.status(201).json({ article: await articles.create(article, userId(request.userId)) });
  }));

  router.put('/:slug', requireAuth(tokens), asyncHandler(async (request, response) => {
    const { article } = updateArticleSchema.parse(request.body);
    response.json({
      article: await articles.update(request.params.slug, article, userId(request.userId)),
    });
  }));

  router.delete('/:slug', requireAuth(tokens), asyncHandler(async (request, response) => {
    await articles.delete(request.params.slug, userId(request.userId));
    response.status(204).send();
  }));

  router.post('/:slug/favorite', requireAuth(tokens), asyncHandler(async (request, response) => {
    response.json({
      article: await articles.favorite(request.params.slug, userId(request.userId)),
    });
  }));

  router.delete('/:slug/favorite', requireAuth(tokens), asyncHandler(async (request, response) => {
    response.json({
      article: await articles.unfavorite(request.params.slug, userId(request.userId)),
    });
  }));

  return router;
}
