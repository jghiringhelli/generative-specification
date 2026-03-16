import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  updateUserSchema
} from '../validation/userSchemas';

const router = Router();
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);

router.post(
  '/users',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = registerSchema.parse(req.body);
      const user = await userService.register(validated.user);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/users/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginSchema.parse(req.body);
      const user = await userService.login(validated.user);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/user',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }
      const user = await userService.getCurrentUser(req.userId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/user',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }
      const validated = updateUserSchema.parse(req.body);
      const user = await userService.updateUser(req.userId, validated.user);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
