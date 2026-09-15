import { Router } from 'express';
import { AuthService } from '../auth/AuthService';
import { authentication } from '../http/auth';
import { asyncHandler } from '../http/asyncHandler';
import { AuthenticatedRequest, OptionalAuthRequest } from '../http/request';
import { ProfileService } from './ProfileService';

export function createProfileRouter(service: ProfileService, auth: AuthService): Router {
  const router = Router();
  const optionalAuth = authentication(auth, false);
  const requireAuth = authentication(auth, true);

  router.get('/:username', optionalAuth, asyncHandler(async (request, response) => {
    const viewerId = (request as OptionalAuthRequest).userId;
    response.json({ profile: await service.get(request.params.username!, viewerId) });
  }));
  router.post('/:username/follow', requireAuth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.json({ profile: await service.follow(request.params.username!, userId) });
  }));
  router.delete('/:username/follow', requireAuth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).userId;
    response.json({ profile: await service.unfollow(request.params.username!, userId) });
  }));
  return router;
}
