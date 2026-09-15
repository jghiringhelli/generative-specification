import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../errors/app-error';
import { CommentService } from '../services/comment.service';

/**
 * Controller handling HTTP requests for article comments.
 */
export class CommentController {
  private readonly commentService: CommentService;

  /**
   * Initializes CommentController.
   */
  constructor(commentService: CommentService = new CommentService()) {
    this.commentService = commentService;
  }

  /**
   * Handles GET /api/articles/:slug/comments
   */
  getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id;
      const comments = await this.commentService.getComments(slug, currentUserId);
      res.status(200).json({ comments });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/articles/:slug/comments
   */
  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const currentUserId = req.user!.id;
      const comment = await this.commentService.addComment(
        slug,
        currentUserId,
        req.body.comment
      );
      res.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/articles/:slug/comments/:id
   */
  deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug, id } = req.params;
      const commentId = parseInt(id, 10);
      if (isNaN(commentId)) {
        throw new ValidationError('Invalid comment id parameter');
      }

      const currentUserId = req.user!.id;
      await this.commentService.deleteComment(slug, commentId, currentUserId);
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
