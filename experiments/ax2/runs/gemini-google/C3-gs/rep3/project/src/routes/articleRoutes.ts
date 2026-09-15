// src/routes/articleRoutes.ts
import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export function createArticleRoutes(articleController: ArticleController): Router {
  const router = Router();

  router.get('/articles', optionalAuth, articleController.listArticles);
  router.get('/articles/feed', requireAuth, articleController.getFeed);
  router.get('/articles/:slug', optionalAuth, articleController.getArticle);
  router.post('/articles', requireAuth, articleController.createArticle);
  router.put('/articles/:slug', requireAuth, articleController.updateArticle);
  router.delete('/articles/:slug', requireAuth, articleController.deleteArticle);
  router.post('/articles/:slug/favorite', requireAuth, articleController.favoriteArticle);
  router.delete('/articles/:slug/favorite', requireAuth, articleController.unfavoriteArticle);

  return router;
}
