import { Router, Request, Response, NextFunction } from 'express';
import { CommentService } from './comment.service';
import { createCommentSchema } from './comment.dto';
import { validateBody } from '../../middleware/validation.middleware';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../errors/app-error';

export function createCommentsRouter(
  commentService: CommentService = new CommentService()
): Router {
  const router = Router({ mergeParams: true });

  router.get(
    '/',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const slug = req.params.slug;
        const currentUserId = req.user?.id;
        const comments = await commentService.getComments(slug, currentUserId);
        res.status(200).json({ comments });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/',
    requireAuth,
    validateBody(createCommentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const slug = req.params.slug;
        const currentUserId = req.user!.id;
        const comment = await commentService.addComment(slug, currentUserId, req.body);
        res.status(200).json({ comment });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:id',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const slug = req.params.slug;
        const commentId = parseInt(req.params.id, 10);
        if (isNaN(commentId)) {
          throw new NotFoundError(`Comment with id '${req.params.id}' not found`);
        }
        const currentUserId = req.user!.id;
        await commentService.deleteComment(slug, commentId, currentUserId);
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
