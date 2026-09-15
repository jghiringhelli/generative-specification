import { Router } from 'express';
import { body, param, query } from 'express-validator';
import type { ITokenService } from '../auth/ITokenService';
import type { ArticleController } from '../controllers/ArticleController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const pagination = [
  query('limit').optional().isInt({ min: 0, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate,
];
const slug = [param('slug').isString().notEmpty(), validate];

export function createArticleRouter(controller: ArticleController, tokens: ITokenService): Router {
  const router = Router();
  router.get('/articles', optionalAuth(tokens), pagination, controller.list);
  router.get('/articles/feed', requireAuth(tokens), pagination, controller.feed);
  router.get('/articles/:slug', optionalAuth(tokens), slug, controller.get);
  router.post('/articles', requireAuth(tokens), [
    body('article.title').isString().trim().notEmpty(),
    body('article.description').isString().notEmpty(),
    body('article.body').isString().notEmpty(),
    body('article.tagList').optional().isArray(),
    body('article.tagList.*').optional().isString().trim().notEmpty(),
    validate,
  ], controller.create);
  router.put('/articles/:slug', requireAuth(tokens), [
    param('slug').isString().notEmpty(),
    body('article').isObject(),
    body('article.title').optional().isString().trim().notEmpty(),
    body('article.description').optional().isString().notEmpty(),
    body('article.body').optional().isString().notEmpty(),
    validate,
  ], controller.update);
  router.delete('/articles/:slug', requireAuth(tokens), slug, controller.delete);
  router.post('/articles/:slug/favorite', requireAuth(tokens), slug, controller.favorite);
  router.delete('/articles/:slug/favorite', requireAuth(tokens), slug, controller.unfavorite);
  return router;
}
