// src/controllers/CommentController.ts
import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/CommentService';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  public getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;
      const comments = await this.commentService.getComments(slug, currentUserId);
      res.status(200).json({ comments });
    } catch (err) {
      next(err);
    }
  };

  public addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      if (!req.body || !req.body.comment) {
        throw new ValidationError('Validation failed', {
          comment: ["can't be blank"]
        });
      }

      const { slug } = req.params;
      const { body } = req.body.comment;
      const comment = await this.commentService.addComment(req.user.id, slug, body);
      res.status(201).json({ comment });
    } catch (err) {
      next(err);
    }
  };

  public deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { id } = req.params;
      await this.commentService.deleteComment(req.user.id, id);
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}
