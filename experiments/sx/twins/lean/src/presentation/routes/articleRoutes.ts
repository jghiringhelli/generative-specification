import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export const createArticleRoutes = (
  articleController: ArticleController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  router.get('/articles', authMiddleware.optionalAuthenticate, articleController.listArticles);
  router.get('/articles/feed', authMiddleware.authenticate, articleController.getFeed);
  router.get('/articles/:slug', authMiddleware.optionalAuthenticate, articleController.getArticle);
  router.post('/articles', authMiddleware.authenticate, articleController.createArticle);
  router.put('/articles/:slug', authMiddleware.authenticate, articleController.updateArticle);
  router.delete('/articles/:slug', authMiddleware.authenticate, articleController.deleteArticle);
  router.post('/articles/:slug/favorite', authMiddleware.authenticate, articleController.favoriteArticle);
  router.delete('/articles/:slug/favorite', authMiddleware.authenticate, articleController.unfavoriteArticle);

  return router;
};
