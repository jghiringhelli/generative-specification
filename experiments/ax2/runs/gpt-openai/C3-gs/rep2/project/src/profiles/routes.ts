import { Router } from 'express';
import { TokenService } from '../auth/ports';
import { UnauthorizedError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { ProfileService } from './ProfileService';

function requireUserId(userId: string | undefined): string {
  if (!userId) {
    throw new UnauthorizedError('Authentication is required');
  }
  return userId;
}

/** Creates profile API routes. */
export function createProfileRouter(profiles: ProfileService, tokens: TokenService): Router {
  const router = Router();

  router.get('/:username', optionalAuth(tokens), asyncHandler(async (request, response) => {
    const profile = await profiles.getProfile(request.params.username, request.userId);
    response.json({ profile });
  }));

  router.post('/:username/follow', requireAuth(tokens), asyncHandler(async (request, response) => {
    const profile = await profiles.follow(request.params.username, requireUserId(request.userId));
    response.json({ profile });
  }));

  router.delete('/:username/follow', requireAuth(tokens), asyncHandler(async (request, response) => {
    const profile = await profiles.unfollow(request.params.username, requireUserId(request.userId));
    response.json({ profile });
  }));

  return router;
}
