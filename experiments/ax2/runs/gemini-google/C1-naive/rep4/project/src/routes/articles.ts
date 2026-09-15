import { Router } from 'express';
import {
  listArticles,
  feedArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle
} from '../controllers/articleController';
import {
  getComments,
  addComment,
  deleteComment
} from '../controllers/commentController';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router = Router();

router.get('/', optionalAuth, listArticles);
router.get('/feed', requireAuth, feedArticles);
router.get('/:slug', optionalAuth, getArticle);
router.post('/', requireAuth, createArticle);
router.put('/:slug', requireAuth, updateArticle);
router.delete('/:slug', requireAuth, deleteArticle);
router.post('/:slug/favorite', requireAuth, favoriteArticle);
router.delete('/:slug/favorite', requireAuth, unfavoriteArticle);

// Comments
router.get('/:slug/comments', optionalAuth, getComments);
router.post('/:slug/comments', requireAuth, addComment);
router.delete('/:slug/comments/:id', requireAuth, deleteComment);

export default router;
