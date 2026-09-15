import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/AuthService';
import { authentication } from '../http/auth';
import { asyncHandler } from '../http/asyncHandler';
import { AuthenticatedRequest, OptionalAuthRequest } from '../http/request';
import { validateBody } from '../http/validate';
import { ArticleService } from './ArticleService';

const DEFAULT_LIMIT = 20;
const MAXIMUM_LIMIT = 100;
const querySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(MAXIMUM_LIMIT).default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});
const articleFields = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  body: z.string().min(1),
  tagList: z.array(z.string().trim().min(1)).default([]),
});
const createSchema = z.object({ article: articleFields });
const updateSchema = z.object({
  article: articleFields.partial().refine((value) => Object.keys(value).length > 0),
});

export function createArticleRouter(service: ArticleService, auth: AuthService): Router {
  const router = Router();
  const optionalAuth = authentication(auth, false);
  const requireAuth = authentication(auth, true);

  router.get('/', optionalAuth, asyncHandler(async (request, response) => {
    const query = querySchema.parse(request.query);
    response.json(await service.list(query, (request as OptionalAuthRequest).userId));
  }));
  router.get('/feed', requireAuth, asyncHandler(async (request, response) => {
    const query = querySchema.parse(request.query);
    const userId = (request as AuthenticatedRequest).userId;
    response.json(await service.list({ ...query, followerId: userId }, userId));
  }));
  router.get('/:slug', optionalAuth, asyncHandler(async (request, response) => {
    response.json({ article: await service.get(
      request.params.slug!, (request as OptionalAuthRequest).userId,
    ) });
  }));
  router.post('/', requireAuth, validateBody(createSchema), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.status(201).json({ article: await service.create(userId, request.body.article) });
  }));
  router.put('/:slug', requireAuth, validateBody(updateSchema), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.json({ article: await service.update(request.params.slug!, userId, request.body.article) });
  }));
  router.delete('/:slug', requireAuth, asyncHandler(async (request, response) => {
    await service.delete(request.params.slug!, (request as AuthenticatedRequest).userId);
    response.sendStatus(204);
  }));
  router.post('/:slug/favorite', requireAuth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.json({ article: await service.favorite(request.params.slug!, userId) });
  }));
  router.delete('/:slug/favorite', requireAuth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.json({ article: await service.unfavorite(request.params.slug!, userId) });
  }));
  return router;
}
