import { Router } from 'express';
import { Container } from '../container';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  parseArticleFilter,
  parsePagination,
  requireUserId,
} from '../controllers/requestHelpers';
import { createCommentRouter } from './commentRoutes';

/**
 * Build the router for article listing, feed, CRUD, and favoriting endpoints.
 * @param container - Wired application services.
 * @returns An Express router mounted under /api/articles.
 */
export function createArticleRouter(container: Container): Router {
  const router = Router();
  const { articleService } = container;

  router.get('/', optionalAuth, async (req, res) => {
    const result = await articleService.list(parseArticleFilter(req), req.userId);
    res.status(200).json(result);
  });

  router.get('/feed', requireAuth, async (req, res) => {
    const { limit, offset } = parsePagination(req);
    const result = await articleService.feed(requireUserId(req), limit, offset);
    res.status(200).json(result);
  });

  router.get('/:slug', optionalAuth, async (req, res) => {
    const article = await articleService.get(req.params.slug, req.userId);
    res.status(200).json({ article });
  });

  router.post('/', requireAuth, async (req, res) => {
    const article = await articleService.create(requireUserId(req), req.body);
    res.status(201).json({ article });
  });

  router.put('/:slug', requireAuth, async (req, res) => {
    const article = await articleService.update(req.params.slug, requireUserId(req), req.body);
    res.status(200).json({ article });
  });

  router.delete('/:slug', requireAuth, async (req, res) => {
    await articleService.delete(req.params.slug, requireUserId(req));
    res.status(200).json({});
  });

  router.post('/:slug/favorite', requireAuth, async (req, res) => {
    const article = await articleService.favorite(req.params.slug, requireUserId(req));
    res.status(200).json({ article });
  });

  router.delete('/:slug/favorite', requireAuth, async (req, res) => {
    const article = await articleService.unfavorite(req.params.slug, requireUserId(req));
    res.status(200).json({ article });
  });

  router.use('/:slug/comments', createCommentRouter(container));

  return router;
}
