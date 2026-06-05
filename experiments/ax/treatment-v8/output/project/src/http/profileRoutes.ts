/**
 * Router for the profile endpoints. Wires URLs to {@link ProfileController},
 * applying required auth to follow/unfollow and optional auth to the public
 * GET (so its `following` flag can reflect a known viewer). Dependencies are
 * injected, so the same router runs against the Prisma adapter in production
 * and the in-memory fake in tests.
 *
 * @gs-links: docs/specs/profiles.md, docs/adrs/ADR-0002-auth.md
 */
import { Router } from 'express';
import type { ITokenService } from '../services/ports/ITokenService.js';
import type { ProfileService } from '../services/ProfileService.js';
import { ProfileController } from './ProfileController.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { authenticate } from './middleware/authenticate.js';
import { optionalAuthenticate } from './middleware/optionalAuthenticate.js';

/** Dependencies the profile router needs to construct its handlers. */
export interface ProfileRouterDependencies {
  readonly profileService: ProfileService;
  readonly tokenService: ITokenService;
}

/**
 * Build the `/api` profile router.
 *
 * @param deps - the profile service and token service.
 * @returns a configured Express {@link Router}.
 */
export function createProfileRouter(deps: ProfileRouterDependencies): Router {
  const router = Router();
  const controller = new ProfileController(deps.profileService);
  const requireAuth = authenticate(deps.tokenService);
  const optionalAuth = optionalAuthenticate(deps.tokenService);

  router.get(
    '/profiles/:username',
    optionalAuth,
    asyncHandler((req, res) => controller.get(req, res)),
  );
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    asyncHandler((req, res) => controller.follow(req, res)),
  );
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    asyncHandler((req, res) => controller.unfollow(req, res)),
  );

  return router;
}
