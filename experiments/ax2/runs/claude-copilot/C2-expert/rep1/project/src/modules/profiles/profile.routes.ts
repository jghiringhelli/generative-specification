import { Router, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

/**
 * Builds the profiles router. Thin driving adapter: delegation only.
 * @param service injected {@link ProfileService}
 * @returns configured Express router
 */
export function createProfileRouter(service: ProfileService): Router {
  const router = Router();

  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.getProfile(req.params.username, req.user?.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.follow(req.params.username, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.unfollow(req.params.username, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
