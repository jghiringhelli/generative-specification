import { Router, type Response } from 'express';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../auth/middleware';
import { ApplicationError } from '../errors/application-error';
import { ProfileRepository } from './repository';
import { ProfileService } from './service';

const router = Router();
const service = new ProfileService(new ProfileRepository());

function sendError(response: Response, error: unknown): void {
  const status = error instanceof ApplicationError ? error.statusCode : 422;
  const message = error instanceof Error ? error.message : 'Invalid request';
  response.status(status).json({ errors: { body: [message] } });
}

router.get('/profiles/:username', optionalAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    response.json(await service.get(request.params.username, request.userId));
  } catch (error) {
    sendError(response, error);
  }
});

router.post('/profiles/:username/follow', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    response.json(await service.follow(request.params.username, request.userId!));
  } catch (error) {
    sendError(response, error);
  }
});

router.delete('/profiles/:username/follow', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    response.json(await service.unfollow(request.params.username, request.userId!));
  } catch (error) {
    sendError(response, error);
  }
});

export { router as profileRouter };
