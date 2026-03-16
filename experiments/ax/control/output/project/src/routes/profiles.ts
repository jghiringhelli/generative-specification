import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProfileRepository } from '../repositories/profileRepository';
import { UserRepository } from '../repositories/userRepository';
import { ProfileService } from '../services/profileService';
import { AuthRequest, authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const profileRepository = new ProfileRepository(prisma);
const userRepository = new UserRepository(prisma);
const profileService = new ProfileService(profileRepository, userRepository);

router.get(
  '/profiles/:username',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const profile = await profileService.getProfile(username, req.userId);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/profiles/:username/follow',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }
      const { username } = req.params;
      const profile = await profileService.followUser(req.userId, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/profiles/:username/follow',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }
      const { username } = req.params;
      const profile = await profileService.unfollowUser(req.userId, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
