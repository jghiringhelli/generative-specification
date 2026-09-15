import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/CommentService';
import { createCommentSchema } from '../validators/comment.validator';
import { UnauthorizedError } from '../errors/AppError';

export class CommentController {
  private readonly commentService: CommentService;

  constructor(commentService: CommentService) {
    this.commentService = commentService;
  }

  getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const comments = await this.commentService.getComments(slug, req.user?.id);
      res.status(200).json({ comments });
    } catch (err) {
      next(err);
    }
  };

  createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { slug } = req.params;
      const parsed = createCommentSchema.parse(req.body);
      const comment = await this.commentService.createComment(
        slug,
        parsed.comment,
        req.user.id
      );
      res.status(200).json({ comment });
    } catch (err) {
      next(err);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { slug, id } = req.params;
      await this.commentService.deleteComment(slug, id, req.user.id);
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  };
}
