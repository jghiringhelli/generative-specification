import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { CommentController } from '../controllers/CommentController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { AppConfig } from '../config/config';

/** Wire article, favorite, and comment routes to their controllers. */
export function articleRoutes(
  articles: ArticleController,
  comments: CommentController,
  config: AppConfig,
): Router {
  const router = Router();

  router.get('/', optionalAuth(config), articles.list);
  router.get('/feed', requireAuth(config), articles.feed);
  router.get('/:slug', optionalAuth(config), articles.get);
  router.post('/', requireAuth(config), articles.create);
  router.put('/:slug', requireAuth(config), articles.update);
  router.delete('/:slug', requireAuth(config), articles.remove);

  router.post('/:slug/favorite', requireAuth(config), articles.favorite);
  router.delete('/:slug/favorite', requireAuth(config), articles.unfavorite);

  router.get('/:slug/comments', optionalAuth(config), comments.list);
  router.post('/:slug/comments', requireAuth(config), comments.create);
  router.delete('/:slug/comments/:id', requireAuth(config), comments.remove);

  return router;
}
