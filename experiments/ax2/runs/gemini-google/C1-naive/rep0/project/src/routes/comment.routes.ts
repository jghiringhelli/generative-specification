import { Router } from 'express';
import {
  getComments,
  addComment,
  deleteComment
} from '../controllers/comment.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/articles/:slug/comments', optionalAuth, getComments);
router.post('/articles/:slug/comments', requireAuth, addComment);
router.delete('/articles/:slug/comments/:id', requireAuth, deleteComment);

export default router;
