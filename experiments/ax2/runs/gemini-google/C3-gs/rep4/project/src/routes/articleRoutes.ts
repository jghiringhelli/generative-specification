import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { authOptional, authRequired } from '../middleware/auth';

export function createArticleRouter(articleController: ArticleController): Router {
  const router = Router();

  router.get('/articles', authOptional, (req, res, next) =>
    articleController.listArticles(req, res, next)
  );

  router.get('/articles/feed', authRequired, (req, res, next) =>
    articleController.getFeed(req, res, next)
  );

  router.get('/articles/:slug', authOptional, (req, res, next) =>
    articleController.getArticle(req, res, next)
  );

  router.post('/articles', authRequired, (req, res, next) =>
    articleController.createArticle(req, res, next)
  );

  router.put('/articles/:slug', authRequired, (req, res, next) =>
    articleController.updateArticle(req, res, next)
  );

  router.delete('/articles/:slug', authRequired, (req, res, next) =>
    articleController.deleteArticle(req, res, next)
  );

  router.post('/articles/:slug/favorite', authRequired, (req, res, next) =>
    articleController.favoriteArticle(req, res, next)
  );

  router.delete('/articles/:slug/favorite', authRequired, (req, res, next) =>
    articleController.unfavoriteArticle(req, res, next)
  );

  return router;
}
