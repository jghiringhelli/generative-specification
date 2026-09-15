import { NextFunction, Request, Response, Router } from 'express';
import { createAuthenticationMiddleware } from '../http/auth.middleware';
import { AuthenticatedRequest } from '../http/request';
import { UserService } from './user.service';
import { loginSchema, registerSchema, updateUserSchema } from './user.schemas';

/** Creates user authentication routes. */
export function createUserRouter(service: UserService, jwtSecret: string): Router {
  const router = Router();
  const requireAuthentication = createAuthenticationMiddleware(jwtSecret);

  router.post('/users', handle((request) => {
    const { user } = registerSchema.parse(request.body);
    return service.register(user.email, user.username, user.password);
  }));

  router.post('/users/login', handle((request) => {
    const { user } = loginSchema.parse(request.body);
    return service.login(user.email, user.password);
  }));

  router.get('/user', requireAuthentication, handle((request) =>
    service.getCurrent((request as AuthenticatedRequest).userId)));

  router.put('/user', requireAuthentication, handle((request) => {
    const { user } = updateUserSchema.parse(request.body);
    return service.update((request as AuthenticatedRequest).userId, user);
  }));

  return router;
}

function handle(operation: (request: Request) => Promise<unknown>) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json({ user: await operation(request) });
    } catch (error) {
      next(error);
    }
  };
}
