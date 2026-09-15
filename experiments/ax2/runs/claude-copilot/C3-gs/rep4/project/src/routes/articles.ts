import { Request, Response, Router } from 'express';
import { ArticleService } from '../services/ArticleService';
import { ITokenService } from '../services/ports/ITokenService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { parsePagination, requireUserId } from './helpers';
import {
  createArticleSchema,
  parseOrThrow,
  updateArticleSchema,
} from '../validation/schemas';

/**
 * Build the articles router (driving adapter) delegating to {@link ArticleService}.
 * @param articles the article service.
 * @param tokens the token service used by auth middleware.
 */
export function buildArticleRouter(articles: ArticleService, tokens: ITokenService): Router {
  const router = Router();

  router.get('/feed', requireAuth(tokens), async (req: Request, res: Response) => {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    res.status(200).json(await articles.feed(requireUserId(req), { limit, offset }));
  });

  router.get('/', optionalAuth(tokens), async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const { limit, offset } = parsePagination(query);
    const envelope = await articles.listArticles(
      {
        tag: typeof query.tag === 'string' ? query.tag : undefined,
        author: typeof query.author === 'string' ? query.author : undefined,
        favorited: typeof query.favorited === 'string' ? query.favorited : undefined,
        limit,
        offset,
      },
      req.userId ?? null,
    );
    res.status(200).json(envelope);
  });

  router.post('/', requireAuth(tokens), async (req: Request, res: Response) => {
    const { article } = parseOrThrow(createArticleSchema, req.body);
    const view = await articles.createArticle(requireUserId(req), article);
    res.status(201).json({ article: view });
  });

  router.get('/:slug', optionalAuth(tokens), async (req: Request, res: Response) => {
    const view = await articles.getArticle(req.params.slug, req.userId ?? null);
    res.status(200).json({ article: view });
  });

  router.put('/:slug', requireAuth(tokens), async (req: Request, res: Response) => {
    const { article } = parseOrThrow(updateArticleSchema, req.body);
    const view = await articles.updateArticle(req.params.slug, requireUserId(req), article);
    res.status(200).json({ article: view });
  });

  router.delete('/:slug', requireAuth(tokens), async (req: Request, res: Response) => {
    await articles.deleteArticle(req.params.slug, requireUserId(req));
    res.status(200).json({});
  });

  router.post('/:slug/favorite', requireAuth(tokens), async (req: Request, res: Response) => {
    const view = await articles.favorite(req.params.slug, requireUserId(req));
    res.status(200).json({ article: view });
  });

  router.delete('/:slug/favorite', requireAuth(tokens), async (req: Request, res: Response) => {
    const view = await articles.unfavorite(req.params.slug, requireUserId(req));
    res.status(200).json({ article: view });
  });

  return router;
}
