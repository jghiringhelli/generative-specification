/**
 * Router for the article endpoints. Wires URLs to {@link ArticleController},
 * applying required auth to authoring/feed/favorite routes and optional auth to
 * the public reads (so their viewer-relative `favorited`/`following` flags can
 * reflect a known caller). Dependencies are injected, so the same router runs
 * against the Prisma adapter in production and the in-memory fake in tests.
 *
 * Route order matters: `/articles/feed` is registered before `/articles/:slug`
 * so the literal path is not captured by the slug parameter.
 *
 * @gs-links: docs/specs/articles.md, docs/adrs/ADR-0002-auth.md
 */
import { Router } from 'express';
import type { ArticleService } from '../services/ArticleService.js';
import type { ITokenService } from '../services/ports/ITokenService.js';
import { ArticleController } from './ArticleController.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { authenticate } from './middleware/authenticate.js';
import { optionalAuthenticate } from './middleware/optionalAuthenticate.js';

/** Dependencies the article router needs to construct its handlers. */
export interface ArticleRouterDependencies {
  readonly articleService: ArticleService;
  readonly tokenService: ITokenService;
}

/**
 * Build the `/api` article router.
 *
 * @param deps - the article service and token service.
 * @returns a configured Express {@link Router}.
 */
export function createArticleRouter(deps: ArticleRouterDependencies): Router {
  const router = Router();
  const controller = new ArticleController(deps.articleService);
  const requireAuth = authenticate(deps.tokenService);
  const optionalAuth = optionalAuthenticate(deps.tokenService);

  router.get(
    '/articles/feed',
    requireAuth,
    asyncHandler((req, res) => controller.feed(req, res)),
  );
  router.get(
    '/articles',
    optionalAuth,
    asyncHandler((req, res) => controller.list(req, res)),
  );
  router.post(
    '/articles',
    requireAuth,
    asyncHandler((req, res) => controller.create(req, res)),
  );
  router.get(
    '/articles/:slug',
    optionalAuth,
    asyncHandler((req, res) => controller.get(req, res)),
  );
  router.put(
    '/articles/:slug',
    requireAuth,
    asyncHandler((req, res) => controller.update(req, res)),
  );
  router.delete(
    '/articles/:slug',
    requireAuth,
    asyncHandler((req, res) => controller.remove(req, res)),
  );
  router.post(
    '/articles/:slug/favorite',
    requireAuth,
    asyncHandler((req, res) => controller.favorite(req, res)),
  );
  router.delete(
    '/articles/:slug/favorite',
    requireAuth,
    asyncHandler((req, res) => controller.unfavorite(req, res)),
  );

  return router;
}
