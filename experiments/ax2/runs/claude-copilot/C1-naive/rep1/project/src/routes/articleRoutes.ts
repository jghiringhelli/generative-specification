import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  listArticles,
  feedArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
} from '../controllers/articleController';
import {
  getComments,
  addComment,
  deleteComment,
} from '../controllers/commentController';

const router = Router();

router.get('/articles', optionalAuth, listArticles);
router.get('/articles/feed', requireAuth, feedArticles);
router.get('/articles/:slug', optionalAuth, getArticle);
router.post('/articles', requireAuth, createArticle);
router.put('/articles/:slug', requireAuth, updateArticle);
router.delete('/articles/:slug', requireAuth, deleteArticle);
router.post('/articles/:slug/favorite', requireAuth, favoriteArticle);
router.delete('/articles/:slug/favorite', requireAuth, unfavoriteArticle);

router.get('/articles/:slug/comments', optionalAuth, getComments);
router.post('/articles/:slug/comments', requireAuth, addComment);
router.delete('/articles/:slug/comments/:id', requireAuth, deleteComment);

export default router;
