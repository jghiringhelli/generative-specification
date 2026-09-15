import { Router } from 'express';
import {
  listArticles,
  feedArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
} from '../controllers/articles.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

// GET /api/articles/feed — feed of followed users (must come before /:slug)
router.get('/articles/feed', requireAuth, asyncHandler(feedArticles));
// GET /api/articles — list articles
router.get('/articles', optionalAuth, asyncHandler(listArticles));
// GET /api/articles/:slug — get article
router.get('/articles/:slug', optionalAuth, asyncHandler(getArticle));
// POST /api/articles — create article
router.post('/articles', requireAuth, asyncHandler(createArticle));
// PUT /api/articles/:slug — update article
router.put('/articles/:slug', requireAuth, asyncHandler(updateArticle));
// DELETE /api/articles/:slug — delete article
router.delete('/articles/:slug', requireAuth, asyncHandler(deleteArticle));
// POST /api/articles/:slug/favorite — favorite article
router.post('/articles/:slug/favorite', requireAuth, asyncHandler(favoriteArticle));
// DELETE /api/articles/:slug/favorite — unfavorite article
router.delete('/articles/:slug/favorite', requireAuth, asyncHandler(unfavoriteArticle));

export default router;
