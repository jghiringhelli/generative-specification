import { Router } from 'express';
import { getComments, addComment, deleteComment } from '../controllers/comments.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

// GET /api/articles/:slug/comments — get comments
router.get('/articles/:slug/comments', optionalAuth, asyncHandler(getComments));
// POST /api/articles/:slug/comments — add comment
router.post('/articles/:slug/comments', requireAuth, asyncHandler(addComment));
// DELETE /api/articles/:slug/comments/:id — delete comment
router.delete('/articles/:slug/comments/:id', requireAuth, asyncHandler(deleteComment));

export default router;
