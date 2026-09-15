// src/controllers/CommentController.ts
import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/CommentService';
import { UnauthorizedError, ValidationError } from '../errors/AppError';

export class CommentController {
  private commentService: CommentService;

  constructor(commentService: CommentService) {
    this.commentService = commentService;
  }

  getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;
      const comments = await this.commentService.getComments(slug, currentUserId);
      res.status(200).json({ comments });
    } catch (err) {
      next(err);
    }
  };

  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { slug } = req.params;
      const commentData = req.body?.comment;
      if (!commentData) {
        throw new ValidationError({ comment: ["can't be blank"] });
      }

      const comment = await this.commentService.addComment(slug, req.user.id, commentData.body);
      res.status(201).json({ comment });
    } catch (err) {
      next(err);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const commentId = parseInt(req.params.id, 10);
      if (isNaN(commentId)) {
        throw new ValidationError({ id: ['must be an integer'] });
      }

      await this.commentService.deleteComment(commentId, req.user.id);
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  };
}
