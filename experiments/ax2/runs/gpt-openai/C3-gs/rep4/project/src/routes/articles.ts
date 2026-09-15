import { Router } from 'express';
import { z } from 'zod';
import type { ArticleService } from '../articles/ArticleService';
import type { ITokenService } from '../auth/JwtTokenService';
import { ValidationError } from '../errors/AppError';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const paginationSchema = z.object({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(0).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
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
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

/** Creates the article API router. */
export function createArticleRouter(
  articles: ArticleService,
  tokens: ITokenService,
): Router {
  const router = Router();

  router.get('/', optionalAuth(tokens), async (request, response, next) => {
    try {
      const filters = parseQuery(request.query);
      response.json(await articles.list(filters, request.userId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/feed', requireAuth(tokens), async (request, response, next) => {
    try {
      const { limit, offset } = parseQuery(request.query);
      response.json(await articles.feed(request.userId!, limit, offset));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:slug', optionalAuth(tokens), async (request, response, next) => {
    try {
      response.json({ article: await articles.get(request.params.slug, request.userId) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requireAuth(tokens), validateBody(createSchema), async (request, response, next) => {
    try {
      const article = await articles.create(request.userId!, request.body.article);
      response.status(201).json({ article });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    '/:slug',
    requireAuth(tokens),
    validateBody(updateSchema),
    async (request, response, next) => {
      try {
        const article = await articles.update(
          request.params.slug,
          request.userId!,
          request.body.article,
        );
        response.json({ article });
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete('/:slug', requireAuth(tokens), async (request, response, next) => {
    try {
      await articles.delete(request.params.slug, request.userId!);
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:slug/favorite', requireAuth(tokens), async (request, response, next) => {
    try {
      response.json({ article: await articles.favorite(request.params.slug, request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:slug/favorite', requireAuth(tokens), async (request, response, next) => {
    try {
      response.json({ article: await articles.unfavorite(request.params.slug, request.userId!) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseQuery(query: unknown) {
  const parsed = paginationSchema.safeParse(query);
  if (!parsed.success) {
    throw new ValidationError({ query: parsed.error.issues.map((issue) => issue.message) });
  }
  return parsed.data;
}
