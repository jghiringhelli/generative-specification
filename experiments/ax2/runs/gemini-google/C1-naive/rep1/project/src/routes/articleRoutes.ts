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
import { authRequired, authOptional } from '../middlewares/auth';

const router = Router();

// /api/articles
router.get('/articles', authOptional, listArticles);
router.get('/articles/feed', authRequired, feedArticles);
router.get('/articles/:slug', authOptional, getArticle);
router.post('/articles', authRequired, createArticle);
router.put('/articles/:slug', authRequired, updateArticle);
router.delete('/articles/:slug', authRequired, deleteArticle);

// /api/articles/:slug/favorite
router.post('/articles/:slug/favorite', authRequired, favoriteArticle);
router.delete('/articles/:slug/favorite', authRequired, unfavoriteArticle);

// /api/articles/:slug/comments
router.get('/articles/:slug/comments', authOptional, getComments);
router.post('/articles/:slug/comments', authRequired, addComment);
router.delete('/articles/:slug/comments/:id', authRequired, deleteComment);

export default router;
