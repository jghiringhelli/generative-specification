import { Router } from 'express';
import { CommentRepository } from './comment.repository';
import { CommentService } from './comment.service';
import { ProfileRepository } from '../profiles/profile.repository';
import { createCommentSchema } from './comment.validation';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ValidationError } from '../../utils/errors';

const commentRepository = new CommentRepository();
const profileRepository = new ProfileRepository();
const commentService = new CommentService(commentRepository, profileRepository);

export const commentsRouter = Router();

commentsRouter.get(
  '/articles/:slug/comments',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const result = await commentService.listComments(
      req.params.slug,
      req.user?.id,
    );
    res.status(200).json(result);
  }),
);

commentsRouter.post(
  '/articles/:slug/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { comment } = createCommentSchema.parse(req.body);
    const result = await commentService.addComment(
      req.params.slug,
      comment.body,
      req.user!.id,
    );
    res.status(201).json(result);
  }),
);

commentsRouter.delete(
  '/articles/:slug/comments/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const commentId = Number(req.params.id);
    if (!Number.isInteger(commentId)) {
      throw new ValidationError(['comment id must be an integer']);
    }
    await commentService.deleteComment(
      req.params.slug,
      commentId,
      req.user!.id,
    );
    res.status(200).json({});
  }),
);
