import { Router } from 'express';
import { z } from 'zod';
import type { ArticleService } from '../services/ArticleService';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { zodToValidationError } from '../utils/zodError';
import type { Article } from '../types/domain';

// =============================================================================
// Zod schemas
// =============================================================================

const CreateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional().default([]),
  }),
});

const UpdateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      body: z.string().optional(),
      tagList: z.array(z.string()).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: 'no fields provided',
    }),
});

const ArticleQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const FeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// =============================================================================
// Response helpers
// =============================================================================

/** §§ Spec change 2024-08-16: list endpoints omit `body` for performance. */
type ArticleListItem = Omit<Article, 'body'>;

function toListItem(article: Article): ArticleListItem {
  // Destructure to explicitly discard body — _body prefix suppresses noUnusedLocals
  const { body: _body, ...rest } = article;
  return rest;
}

// =============================================================================
// Router factory
// =============================================================================

/**
 * Factory that constructs the articles router with injected service dependency.
 *
 * Routes:
 *   GET    /articles                     — list articles (auth optional)
 *   GET    /articles/feed                — personalized feed (auth required)
 *   GET    /articles/:slug               — single article (auth optional)
 *   POST   /articles                     — create article (auth required)
 *   PUT    /articles/:slug               — update article (auth required, author only)
 *   DELETE /articles/:slug               — delete article (auth required, author only)
 *   POST   /articles/:slug/favorite      — favorite article (auth required)
 *   DELETE /articles/:slug/favorite      — unfavorite article (auth required)
 *
 * @param articleService - Injected article business-logic service
 * @returns Configured Express Router
 */
export function createArticleRouter(articleService: ArticleService): Router {
  const router = Router();

  // GET /api/articles/feed — personalized feed (must be registered before /:slug)
  router.get(
    '/articles/feed',
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = FeedQuerySchema.safeParse(req.query);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const result = await articleService.getFeed(req.userId!, parsed.data);
      res.status(200).json({
        articles: result.articles.map(toListItem),
        articlesCount: result.articlesCount,
      });
    }),
  );

  // GET /api/articles — list articles with optional filters
  router.get(
    '/articles',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const parsed = ArticleQuerySchema.safeParse(req.query);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const { tag, author, favorited, limit, offset } = parsed.data;
      const result = await articleService.listArticles(
        { tag, author, favorited },
        { limit, offset },
        req.userId,
      );
      res.status(200).json({
        articles: result.articles.map(toListItem),
        articlesCount: result.articlesCount,
      });
    }),
  );

  // GET /api/articles/:slug — single article
  router.get(
    '/articles/:slug',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const article = await articleService.getArticle(req.params.slug, req.userId);
      res.status(200).json({ article });
    }),
  );

  // POST /api/articles — create article
  router.post(
    '/articles',
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = CreateArticleSchema.safeParse(req.body);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const article = await articleService.createArticle(req.userId!, parsed.data.article);
      res.status(201).json({ article });
    }),
  );

  // PUT /api/articles/:slug — update article (author only)
  router.put(
    '/articles/:slug',
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = UpdateArticleSchema.safeParse(req.body);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const article = await articleService.updateArticle(
        req.params.slug,
        req.userId!,
        parsed.data.article,
      );
      res.status(200).json({ article });
    }),
  );

  // DELETE /api/articles/:slug — delete article (author only)
  router.delete(
    '/articles/:slug',
    requireAuth,
    asyncHandler(async (req, res) => {
      await articleService.deleteArticle(req.params.slug, req.userId!);
      res.status(204).send();
    }),
  );

  // POST /api/articles/:slug/favorite — favorite article
  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    asyncHandler(async (req, res) => {
      const article = await articleService.favoriteArticle(req.userId!, req.params.slug);
      res.status(200).json({ article });
    }),
  );

  // DELETE /api/articles/:slug/favorite — unfavorite article
  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    asyncHandler(async (req, res) => {
      const article = await articleService.unfavoriteArticle(req.userId!, req.params.slug);
      res.status(200).json({ article });
    }),
  );

  return router;
}
