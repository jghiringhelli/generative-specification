/**
 * Router for the comment endpoints (nested under an article slug). Wires URLs to
 * {@link CommentController}, applying required auth to create/delete and optional
 * auth to the public list (so the embedded author's `following` flag can reflect
 * a known caller). Dependencies are injected, so the same router runs against the
 * Prisma adapter in production and the in-memory fake in tests.
 *
 * @gs-links: docs/specs/comments.md, docs/adrs/ADR-0002-auth.md
 */
import { Router } from 'express';
import type { CommentService } from '../services/CommentService.js';
import type { ITokenService } from '../services/ports/ITokenService.js';
import { CommentController } from './CommentController.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { authenticate } from './middleware/authenticate.js';
import { optionalAuthenticate } from './middleware/optionalAuthenticate.js';

/** Dependencies the comment router needs to construct its handlers. */
export interface CommentRouterDependencies {
  readonly commentService: CommentService;
  readonly tokenService: ITokenService;
}

/**
 * Build the `/api` comment router.
 *
 * @param deps - the comment service and token service.
 * @returns a configured Express {@link Router}.
 */
export function createCommentRouter(deps: CommentRouterDependencies): Router {
  const router = Router();
  const controller = new CommentController(deps.commentService);
  const requireAuth = authenticate(deps.tokenService);
  const optionalAuth = optionalAuthenticate(deps.tokenService);

  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    asyncHandler((req, res) => controller.list(req, res)),
  );
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    asyncHandler((req, res) => controller.create(req, res)),
  );
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    asyncHandler((req, res) => controller.remove(req, res)),
  );

  return router;
}
