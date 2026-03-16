import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CommentRepository } from '../repositories/commentRepository';
import { ArticleRepository } from '../repositories/articleRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { CommentService } from '../services/commentService';
import { AuthRequest, authenticateToken, optionalAuth } from '../middleware/auth';
import { createCommentSchema } from '../validation/commentSchemas';

const router = Router();
const prisma = new PrismaClient();
const commentRepository = new CommentRepository(prisma);
const articleRepository = new ArticleRepository(prisma);
const profileRepository = new ProfileRepository(prisma);
const commentService = new CommentService(
  commentRepository,
  articleRepository,
  profileRepository
);

router.get(
  '/articles/:slug/comments',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const comments = await commentService.getComments(slug, req.userId);
      res.status(200).json({ comments });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/articles/:slug/comments',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const { slug } = req.params;
      const validated = createCommentSchema.parse(req.body);
      const comment = await commentService.addComment(
        slug,
        req.userId,
        validated.comment.body
      );

      res.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/articles/:slug/comments/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }

      const { slug, id } = req.params;
      await commentService.deleteComment(slug, id, req.userId);

      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  }
);

export default router;
