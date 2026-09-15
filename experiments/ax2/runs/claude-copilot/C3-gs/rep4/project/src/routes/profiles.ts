import { Request, Response, Router } from 'express';
import { ProfileService } from '../services/ProfileService';
import { ITokenService } from '../services/ports/ITokenService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { requireUserId } from './helpers';

/**
 * Build the profiles router (driving adapter) delegating to {@link ProfileService}.
 * @param profiles the profile service.
 * @param tokens the token service used by auth middleware.
 */
export function buildProfileRouter(profiles: ProfileService, tokens: ITokenService): Router {
  const router = Router();

  router.get(
    '/:username',
    optionalAuth(tokens),
    async (req: Request, res: Response) => {
      const view = await profiles.getProfile(req.params.username, req.userId ?? null);
      res.status(200).json({ profile: view });
    },
  );

  router.post(
    '/:username/follow',
    requireAuth(tokens),
    async (req: Request, res: Response) => {
      const view = await profiles.follow(req.params.username, requireUserId(req));
      res.status(200).json({ profile: view });
    },
  );

  router.delete(
    '/:username/follow',
    requireAuth(tokens),
    async (req: Request, res: Response) => {
      const view = await profiles.unfollow(req.params.username, requireUserId(req));
      res.status(200).json({ profile: view });
    },
  );

  return router;
}
