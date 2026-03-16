import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export const articleRoutes = Router();

articleRoutes.get('/', optionalAuth, articleController.listArticles);
articleRoutes.get('/feed', requireAuth, articleController.getFeed);
articleRoutes.get('/:slug', optionalAuth, articleController.getArticle);

articleRoutes.post('/', requireAuth, articleController.createArticle);
articleRoutes.put('/:slug', requireAuth, articleController.updateArticle);
articleRoutes.delete('/:slug', requireAuth, articleController.deleteArticle);

articleRoutes.post('/:slug/favorite', requireAuth, articleController.favoriteArticle);
articleRoutes.delete('/:slug/favorite', requireAuth, articleController.unfavoriteArticle);
