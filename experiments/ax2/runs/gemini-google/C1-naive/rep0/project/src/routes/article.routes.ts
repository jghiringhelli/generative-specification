import { Router } from 'express';
import {
  listArticles,
  getFeed,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle
} from '../controllers/article.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/articles', optionalAuth, listArticles);
router.get('/articles/feed', requireAuth, getFeed);
router.post('/articles', requireAuth, createArticle);

router.post('/articles/:slug/favorite', requireAuth, favoriteArticle);
router.delete('/articles/:slug/favorite', requireAuth, unfavoriteArticle);

router.get('/articles/:slug', optionalAuth, getArticle);
router.put('/articles/:slug', requireAuth, updateArticle);
router.delete('/articles/:slug', requireAuth, deleteArticle);

export default router;
