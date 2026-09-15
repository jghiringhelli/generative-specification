import { Request, Response, Router } from 'express';
import { ArticleQuery, ArticleService } from '../services/ArticleService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { IUserRepository } from '../repositories/IUserRepository';
import { UnauthorizedError } from '../errors/AppError';
import { UserEntity } from '../domain/types';

/**
 * Retrieve the authenticated user or throw.
 * @param req - The request.
 * @returns The authenticated user.
 */
function currentUser(req: Request): UserEntity {
  if (!req.user) {
    throw new UnauthorizedError('authorization required');
  }
  return req.user;
}

/**
 * Build the router for article endpoints.
 * @param articleService - Article service.
 * @param jwtSecret - JWT signing secret (for auth middleware).
 * @param userRepository - User lookup port (for auth middleware).
 * @returns The configured router.
 */
export function createArticleRouter(
  articleService: ArticleService,
  jwtSecret: string,
  userRepository: IUserRepository
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret, userRepository);
  const maybeAuth = optionalAuth(jwtSecret, userRepository);

  router.get('/articles/feed', auth, async (req: Request, res: Response) => {
    const result = await articleService.feed(req.query as ArticleQuery, req.userId as number);
    res.status(200).json(result);
  });

  router.get('/articles', maybeAuth, async (req: Request, res: Response) => {
    const result = await articleService.list(req.query as ArticleQuery, req.userId);
    res.status(200).json(result);
  });

  router.get('/articles/:slug', maybeAuth, async (req: Request, res: Response) => {
    const result = await articleService.getBySlug(req.params.slug, req.userId);
    res.status(200).json(result);
  });

  router.post('/articles', auth, async (req: Request, res: Response) => {
    const result = await articleService.create(req.body, currentUser(req));
    res.status(201).json(result);
  });

  router.put('/articles/:slug', auth, async (req: Request, res: Response) => {
    const result = await articleService.update(req.params.slug, req.body, currentUser(req));
    res.status(200).json(result);
  });

  router.delete('/articles/:slug', auth, async (req: Request, res: Response) => {
    await articleService.delete(req.params.slug, currentUser(req));
    res.status(200).json({});
  });

  router.post('/articles/:slug/favorite', auth, async (req: Request, res: Response) => {
    const result = await articleService.favorite(req.params.slug, req.userId as number);
    res.status(200).json(result);
  });

  router.delete('/articles/:slug/favorite', auth, async (req: Request, res: Response) => {
    const result = await articleService.unfavorite(req.params.slug, req.userId as number);
    res.status(200).json(result);
  });

  return router;
}
