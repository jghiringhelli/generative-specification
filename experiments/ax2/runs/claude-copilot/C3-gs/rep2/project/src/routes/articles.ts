import { Router } from 'express';
import { ArticleService } from '../services/ArticleService';
import { CommentService } from '../services/CommentService';
import { AuthedRequest, optionalAuth, requireAuth } from '../middleware/auth';
import { optionalString, parsePagination, requireUserId } from './helpers';
import {
  createArticleSchema,
  createCommentSchema,
  parseOrThrow,
  updateArticleSchema,
} from '../validation/schemas';

/**
 * Build the router for article and article-scoped comment endpoints.
 * @param articleService - The article service.
 * @param commentService - The comment service.
 * @param jwtSecret - JWT secret for auth middleware.
 * @returns The configured router.
 */
export function createArticleRouter(
  articleService: ArticleService,
  commentService: CommentService,
  jwtSecret: string,
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);
  const maybeAuth = optionalAuth(jwtSecret);

  router.get('/feed', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const { limit, offset } = parsePagination(req.query);
    const result = await articleService.feed(userId, { limit, offset });
    res.status(200).json(result);
  });

  router.get('/', maybeAuth, async (req: AuthedRequest, res) => {
    const { limit, offset } = parsePagination(req.query);
    const result = await articleService.list(
      {
        tag: optionalString(req.query.tag),
        author: optionalString(req.query.author),
        favorited: optionalString(req.query.favorited),
        limit,
        offset,
      },
      req.userId,
    );
    res.status(200).json(result);
  });

  router.post('/', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const { article } = parseOrThrow(createArticleSchema, req.body);
    const created = await articleService.create(userId, article);
    res.status(201).json({ article: created });
  });

  router.get('/:slug', maybeAuth, async (req: AuthedRequest, res) => {
    const article = await articleService.getBySlug(req.params.slug, req.userId);
    res.status(200).json({ article });
  });

  router.put('/:slug', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const { article } = parseOrThrow(updateArticleSchema, req.body);
    const updated = await articleService.update(req.params.slug, userId, article);
    res.status(200).json({ article: updated });
  });

  router.delete('/:slug', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    await articleService.delete(req.params.slug, userId);
    res.status(200).json({});
  });

  router.post('/:slug/favorite', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const article = await articleService.favorite(req.params.slug, userId);
    res.status(200).json({ article });
  });

  router.delete('/:slug/favorite', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const article = await articleService.unfavorite(req.params.slug, userId);
    res.status(200).json({ article });
  });

  router.get('/:slug/comments', maybeAuth, async (req: AuthedRequest, res) => {
    const comments = await commentService.list(req.params.slug, req.userId);
    res.status(200).json({ comments });
  });

  router.post('/:slug/comments', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const { comment } = parseOrThrow(createCommentSchema, req.body);
    const created = await commentService.create(req.params.slug, userId, comment.body);
    res.status(201).json({ comment: created });
  });

  router.delete('/:slug/comments/:id', auth, async (req: AuthedRequest, res) => {
    const userId = requireUserId(req);
    const commentId = Number.parseInt(req.params.id, 10);
    await commentService.delete(req.params.slug, commentId, userId);
    res.status(200).json({});
  });

  return router;
}
