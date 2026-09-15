import { NextFunction, Request, Response, Router } from 'express';
import { createAuthenticationMiddleware } from '../http/auth.middleware';
import { createOptionalAuthenticationMiddleware } from '../http/optional-auth.middleware';
import { AuthenticatedRequest } from '../http/request';
import { ProfileService } from './profile.service';

/** Creates profile routes. */
export function createProfileRouter(service: ProfileService, jwtSecret: string): Router {
  const router = Router();
  const requireAuthentication = createAuthenticationMiddleware(jwtSecret);
  const optionalAuthentication = createOptionalAuthenticationMiddleware(jwtSecret);

  router.get('/profiles/:username', optionalAuthentication, handle((request) =>
    service.get(request.params.username, (request as Partial<AuthenticatedRequest>).userId)));
  router.post('/profiles/:username/follow', requireAuthentication, handle((request) =>
    service.follow(request.params.username, (request as AuthenticatedRequest).userId)));
  router.delete('/profiles/:username/follow', requireAuthentication, handle((request) =>
    service.unfollow(request.params.username, (request as AuthenticatedRequest).userId)));

  return router;
}

function handle(operation: (request: Request) => Promise<unknown>) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json({ profile: await operation(request) });
    } catch (error) {
      next(error);
    }
  };
}
