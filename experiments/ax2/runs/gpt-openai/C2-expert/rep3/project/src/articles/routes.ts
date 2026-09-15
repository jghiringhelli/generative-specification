import { Router, type Response } from 'express';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../auth/middleware';
import { ApplicationError } from '../errors/application-error';
import { ArticleRepository } from './repository';
import { articleInputSchema, articleUpdateSchema, listArticlesSchema } from './schemas';
import { ArticleService } from './service';

const router = Router();
const service = new ArticleService(new ArticleRepository());

function sendError(response: Response, error: unknown): void {
  const status = error instanceof ApplicationError ? error.statusCode : 422;
  const message = error instanceof Error ? error.message : 'Invalid request';
  response.status(status).json({ errors: { body: [message] } });
}

router.get('/articles/feed', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  const parsed = listArticlesSchema.safeParse(request.query);
  if (!parsed.success) return sendError(response, parsed.error);
  try { response.json(await service.feed(request.userId!, parsed.data)); } catch (error) { sendError(response, error); }
});

router.get('/articles', optionalAuth, async (request: AuthenticatedRequest, response: Response) => {
  const parsed = listArticlesSchema.safeParse(request.query);
  if (!parsed.success) return sendError(response, parsed.error);
  try { response.json(await service.list(parsed.data, request.userId)); } catch (error) { sendError(response, error); }
});

router.get('/articles/:slug', optionalAuth, async (request: AuthenticatedRequest, response: Response) => {
  try { response.json(await service.get(request.params.slug, request.userId)); } catch (error) { sendError(response, error); }
});

router.post('/articles', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  const parsed = articleInputSchema.safeParse(request.body);
  if (!parsed.success) return sendError(response, parsed.error);
  try { response.status(201).json(await service.create(request.userId!, parsed.data.article)); } catch (error) { sendError(response, error); }
});

router.put('/articles/:slug', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  const parsed = articleUpdateSchema.safeParse(request.body);
  if (!parsed.success) return sendError(response, parsed.error);
  try { response.json(await service.update(request.params.slug, request.userId!, parsed.data.article)); } catch (error) { sendError(response, error); }
});

router.delete('/articles/:slug', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try { await service.delete(request.params.slug, request.userId!); response.sendStatus(204); } catch (error) { sendError(response, error); }
});

router.post('/articles/:slug/favorite', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try { response.json(await service.favorite(request.params.slug, request.userId!)); } catch (error) { sendError(response, error); }
});

router.delete('/articles/:slug/favorite', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try { response.json(await service.unfavorite(request.params.slug, request.userId!)); } catch (error) { sendError(response, error); }
});

export { router as articleRouter };

