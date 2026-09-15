import { Response, NextFunction } from 'express';
import { CommentService } from '../services/CommentService';
import { RequestWithUser } from '../middleware/auth';
import { UnauthorizedError, ValidationError } from '../errors/AppError';

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * Retrieves all comments for an article.
   */
  async getComments(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const comments = await this.commentService.getComments(req.params.slug, req.user?.id);
      res.status(200).json({ comments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Adds a new comment to an article.
   */
  async createComment(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!req.body || !req.body.comment || typeof req.body.comment.body !== 'string') {
        throw new ValidationError({ body: ["'comment.body' is required"] });
      }

      const comment = await this.commentService.createComment(
        req.user.id,
        req.params.slug,
        req.body.comment.body
      );
      res.status(200).json({ comment });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Deletes a comment by id (author only).
   */
  async deleteComment(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await this.commentService.deleteComment(req.user.id, req.params.id);
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  }
}
