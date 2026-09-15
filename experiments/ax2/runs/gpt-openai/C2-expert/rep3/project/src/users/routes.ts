import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth/middleware';
import { ApplicationError } from '../errors/application-error';
import { loginSchema, registerSchema, updateUserSchema } from './schemas';
import { UserRepository } from './repository';
import { UserService } from './service';

const router = Router();
const service = new UserService(new UserRepository());

function sendError(response: Response, error: unknown): void {
  if (error instanceof ApplicationError) {
    response.status(error.statusCode).json({ errors: { [error.field]: [error.message] } });
    return;
  }
  response.status(422).json({ errors: { body: ['Invalid request'] } });
}

router.post('/users', async (request: Request, response: Response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) return sendError(response, parsed.error);
  try {
    response.status(201).json(await service.register(parsed.data.user));
  } catch (error) {
    sendError(response, error);
  }
});

router.post('/users/login', async (request: Request, response: Response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) return sendError(response, parsed.error);
  try {
    response.json(await service.login(parsed.data.user));
  } catch (error) {
    sendError(response, error);
  }
});

router.get('/user', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    response.json(await service.getCurrent(request.userId!));
  } catch (error) {
    sendError(response, error);
  }
});

router.put('/user', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  const parsed = updateUserSchema.safeParse(request.body);
  if (!parsed.success) return sendError(response, parsed.error);
  try {
    response.json(await service.update(request.userId!, parsed.data.user));
  } catch (error) {
    sendError(response, error);
  }
});

export { router as userRouter };
