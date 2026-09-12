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
          errors: { article: ['not found'] }
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
          errors: { body: ["can't be blank"] }
        });
      }

      const newComment = await this.commentService.addComment(slug, comment.body, req.user!.id);

      if (!newComment) {
        return res.status(404).json({
          errors: { article: ['not found'] }
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

      await this.commentService.deleteComment(slug, commentId, req.user!.id);

      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'article not found') {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }
      if (error.message === 'comment not found') {
        return res.status(404).json({
          errors: { comment: ['not found'] }
        });
      }
      if (error.message === 'comment forbidden') {
        return res.status(403).json({
          errors: { comment: ['forbidden'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}
