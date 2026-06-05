/**
 * Router for the tag endpoint. Wires `GET /api/tags` to {@link TagController}.
 * The endpoint is public (no auth) — the tag vocabulary is not viewer-relative.
 * Dependencies are injected, so the same router runs against the Prisma adapter
 * in production and the in-memory fake in tests.
 *
 * @gs-links: docs/specs/tags.md
 */
import { Router } from 'express';
import type { ArticleService } from '../services/ArticleService.js';
import { TagController } from './TagController.js';
import { asyncHandler } from './middleware/asyncHandler.js';

/** Dependencies the tag router needs to construct its handler. */
export interface TagRouterDependencies {
  readonly articleService: ArticleService;
}

/**
 * Build the `/api` tag router.
 *
 * @param deps - the article service (source of the tag vocabulary).
 * @returns a configured Express {@link Router}.
 */
export function createTagRouter(deps: TagRouterDependencies): Router {
  const router = Router();
  const controller = new TagController(deps.articleService);

  router.get(
    '/tags',
    asyncHandler((req, res) => controller.list(req, res)),
  );

  return router;
}
