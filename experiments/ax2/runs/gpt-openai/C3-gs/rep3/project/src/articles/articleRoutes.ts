import { Router } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../errors/AppError';
import { AuthMiddleware } from '../middleware/auth';
import { ArticleService } from './ArticleService';

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(0).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const listSchema = paginationSchema.extend({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
});

const createSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string().min(1)).optional(),
  }),
});

const updateSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
  }).refine((article) => Object.keys(article).length > 0, 'At least one field is required'),
});

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/** Creates article CRUD, feed, and favorite routes. */
export function createArticleRouter(
  service: ArticleService,
  requireAuth: AuthMiddleware,
  optionalAuth: AuthMiddleware,
): Router {
  const router = Router();

  router.get('/articles', optionalAuth, async (request, response) => {
    const query = listSchema.parse(request.query);
    const page = await service.list({
      tag: query.tag,
      author: query.author,
      favoritedBy: query.favorited,
      limit: query.limit,
      offset: query.offset,
    }, request.auth?.userId);
    response.json(page);
  });

  router.get('/articles/feed', requireAuth, async (request, response) => {
    const query = paginationSchema.parse(request.query);
    const page = await service.feed(
      requireUserId(request.auth?.userId),
      query.limit,
      query.offset,
    );
    response.json(page);
  });

  router.get('/articles/:slug', optionalAuth, async (request, response) => {
    response.json({
      article: await service.get(request.params.slug, request.auth?.userId),
    });
  });

  router.post('/articles', requireAuth, async (request, response) => {
    const { article } = createSchema.parse(request.body);
    const userId = requireUserId(request.auth?.userId);
    response.status(201).json({ article: await service.create(article, userId) });
  });

  router.put('/articles/:slug', requireAuth, async (request, response) => {
    const { article } = updateSchema.parse(request.body);
    const userId = requireUserId(request.auth?.userId);
    response.json({
      article: await service.update(request.params.slug, article, userId),
    });
  });

  router.delete('/articles/:slug', requireAuth, async (request, response) => {
    await service.delete(
      request.params.slug,
      requireUserId(request.auth?.userId),
    );
    response.status(204).send();
  });

  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    async (request, response) => {
      response.json({
        article: await service.favorite(
          request.params.slug,
          requireUserId(request.auth?.userId),
        ),
      });
    },
  );

  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    async (request, response) => {
      response.json({
        article: await service.unfavorite(
          request.params.slug,
          requireUserId(request.auth?.userId),
        ),
      });
    },
  );

  return router;
}
