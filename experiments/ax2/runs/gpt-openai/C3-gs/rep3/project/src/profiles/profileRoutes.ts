import { Router } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { AuthMiddleware } from '../middleware/auth';
import { ProfileService } from './ProfileService';

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/** Creates public profile and authenticated follow routes. */
export function createProfileRouter(
  service: ProfileService,
  requireAuth: AuthMiddleware,
  optionalAuth: AuthMiddleware,
): Router {
  const router = Router();

  router.get('/profiles/:username', optionalAuth, async (request, response) => {
    const profile = await service.get(
      request.params.username,
      request.auth?.userId,
    );
    response.json({ profile });
  });

  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (request, response) => {
      const userId = requireUserId(request.auth?.userId);
      response.json({
        profile: await service.follow(request.params.username, userId),
      });
    },
  );

  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (request, response) => {
      const userId = requireUserId(request.auth?.userId);
      response.json({
        profile: await service.unfollow(request.params.username, userId),
      });
    },
  );

  return router;
}
