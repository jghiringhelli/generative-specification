import { Router } from 'express';
import type { ITokenService } from '../auth/JwtTokenService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import type { ProfileService } from '../profiles/ProfileService';

/** Creates the profile API router. */
export function createProfileRouter(
  profiles: ProfileService,
  tokens: ITokenService,
): Router {
  const router = Router();

  router.get('/:username', optionalAuth(tokens), async (request, response, next) => {
    try {
      const profile = await profiles.get(request.params.username, request.userId);
      response.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:username/follow', requireAuth(tokens), async (request, response, next) => {
    try {
      const profile = await profiles.follow(request.params.username, request.userId!);
      response.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:username/follow', requireAuth(tokens), async (request, response, next) => {
    try {
      const profile = await profiles.unfollow(request.params.username, request.userId!);
      response.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
