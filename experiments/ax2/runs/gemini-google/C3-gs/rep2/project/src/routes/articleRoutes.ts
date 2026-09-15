import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { requireAuth, optionalAuth } from '../middleware/auth';

/**
 * Creates and configures the articles router.
 * @param articleController The controller handling article actions.
 * @returns Configured Express Router.
 */
export function createArticleRouter(articleController: ArticleController): Router {
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
