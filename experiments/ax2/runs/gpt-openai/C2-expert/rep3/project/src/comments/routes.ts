import { Router, type Response } from 'express';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../auth/middleware';
import { ApplicationError } from '../errors/application-error';
import { CommentRepository } from './repository';
import { commentInputSchema } from './schemas';
import { CommentService } from './service';

const router = Router();
const service = new CommentService(new CommentRepository());

function sendError(response: Response, error: unknown): void {
  const status = error instanceof ApplicationError ? error.statusCode : 422;
  const message = error instanceof Error ? error.message : 'Invalid request';
  response.status(status).json({ errors: { body: [message] } });
}

router.get('/articles/:slug/comments', optionalAuth, async (request: AuthenticatedRequest, response: Response) => {
  try { response.json(await service.list(request.params.slug, request.userId)); } catch (error) { sendError(response, error); }
});

router.post('/articles/:slug/comments', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  const parsed = commentInputSchema.safeParse(request.body);
  if (!parsed.success) return sendError(response, parsed.error);
  try { response.status(201).json(await service.add(request.params.slug, request.userId!, parsed.data.comment.body)); } catch (error) { sendError(response, error); }
});

router.delete('/articles/:slug/comments/:id', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try { await service.delete(request.params.slug, Number(request.params.id), request.userId!); response.sendStatus(204); } catch (error) { sendError(response, error); }
});

export { router as commentRouter };
