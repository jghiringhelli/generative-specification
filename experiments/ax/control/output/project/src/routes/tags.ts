import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TagRepository } from '../repositories/tagRepository';
import { TagService } from '../services/tagService';

const router = Router();
const prisma = new PrismaClient();
const tagRepository = new TagRepository(prisma);
const tagService = new TagService(tagRepository);

router.get(
  '/tags',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = await tagService.getAllTags();
      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
