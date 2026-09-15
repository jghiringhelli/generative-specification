import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createArticleSchema,
  feedArticlesQuerySchema,
  listArticlesQuerySchema,
  updateArticleSchema,
} from '../validators/article.validator';

/**
 * Creates and configures routes for article operations.
 */
export function createArticleRouter(
  controller: ArticleController = new ArticleController()
): Router {
  const router = Router();

  router.get('/articles', optionalAuth, validateQuery(listArticlesQuerySchema), controller.listArticles);
  router.get('/articles/feed', requireAuth, validateQuery(feedArticlesQuerySchema), controller.listFeed);
  router.get('/articles/:slug', optionalAuth, controller.getArticle);
  router.post('/articles', requireAuth, validateBody(createArticleSchema), controller.createArticle);
  router.put('/articles/:slug', requireAuth, validateBody(updateArticleSchema), controller.updateArticle);
  router.delete('/articles/:slug', requireAuth, controller.deleteArticle);
  router.post('/articles/:slug/favorite', requireAuth, controller.favoriteArticle);
  router.delete('/articles/:slug/favorite', requireAuth, controller.unfavoriteArticle);

  return router;
}
