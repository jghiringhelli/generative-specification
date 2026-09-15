import { Request, Response, Router } from 'express';
import { ProfileService } from '../services/ProfileService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { IUserRepository } from '../repositories/IUserRepository';

/**
 * Build the router for profile endpoints.
 * @param profileService - Profile service.
 * @param jwtSecret - JWT signing secret (for auth middleware).
 * @param userRepository - User lookup port (for auth middleware).
 * @returns The configured router.
 */
export function createProfileRouter(
  profileService: ProfileService,
  jwtSecret: string,
  userRepository: IUserRepository
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret, userRepository);
  const maybeAuth = optionalAuth(jwtSecret, userRepository);

  router.get('/profiles/:username', maybeAuth, async (req: Request, res: Response) => {
    const result = await profileService.getProfile(req.params.username, req.userId);
    res.status(200).json(result);
  });

  router.post('/profiles/:username/follow', auth, async (req: Request, res: Response) => {
    const result = await profileService.follow(req.params.username, req.userId as number);
    res.status(200).json(result);
  });

  router.delete('/profiles/:username/follow', auth, async (req: Request, res: Response) => {
    const result = await profileService.unfollow(req.params.username, req.userId as number);
    res.status(200).json(result);
  });

  return router;
}
