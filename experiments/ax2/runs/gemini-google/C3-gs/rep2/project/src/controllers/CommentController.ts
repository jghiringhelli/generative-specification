import { Response, NextFunction } from 'express';
import { CommentService } from '../services/CommentService';
import { AuthRequest } from '../middleware/auth';
import { CreateCommentSchema } from '../dtos/CommentDTOs';
import { UnauthorizedError } from '../errors/AppError';

export class CommentController {
  private readonly commentService: CommentService;

  constructor(commentService: CommentService) {
    this.commentService = commentService;
  }

  /**
   * Retrieves comments on an article.
   * Route: GET /api/articles/:slug/comments
   */
  public getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const result = await this.commentService.getComments(slug, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adds a comment to an article.
   * Route: POST /api/articles/:slug/comments
   */
  public createComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { slug } = req.params;
      const validated = CreateCommentSchema.parse(req.body);
      const result = await this.commentService.createComment(slug, req.user.id, validated.comment);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a comment from an article.
   * Route: DELETE /api/articles/:slug/comments/:id
   */
  public deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { id } = req.params;
      await this.commentService.deleteComment(id, req.user.id);
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
