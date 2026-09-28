import { Response } from 'express';
import { CommentService } from '../../application/services/CommentService';

export class CommentController {
  constructor(private commentService: CommentService) {}

  getComments = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;

      const comments = await this.commentService.getComments(slug, req.user?.id);

      if (comments === null) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      return res.status(200).json({ comments });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  addComment = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const { comment } = req.body;

      if (!comment || !comment.body) {
        return res.status(422).json({
          errors: { body: ['Comment body is required'] }
        });
      }

      const newComment = await this.commentService.addComment(slug, comment.body, req.user!.id);

      if (!newComment) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      return res.status(201).json({ comment: newComment });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  deleteComment = async (req: any, res: Response) => {
    try {
      const { slug, id } = req.params;
      const commentId = parseInt(id);

      const deleted = await this.commentService.deleteComment(slug, commentId, req.user!.id);

      if (!deleted) {
        return res.status(404).json({
          errors: { body: ['Comment not found'] }
        });
      }

      return res.status(200).json({});
    } catch (error: any) {
      if (error.message === 'Not authorized to delete this comment') {
        return res.status(403).json({
          errors: { body: ['Not authorized to delete this comment'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}
