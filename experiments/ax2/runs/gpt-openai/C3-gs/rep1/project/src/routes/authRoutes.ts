import { Router } from 'express';
import { body } from 'express-validator';
import type { ITokenService } from '../auth/ITokenService';
import type { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export function createAuthRouter(controller: AuthController, tokens: ITokenService): Router {
  const router = Router();
  router.post('/users', [
    body('user.email').isEmail().normalizeEmail(),
    body('user.username').isString().trim().isLength({ min: 1 }),
    body('user.password').isString().isLength({ min: 8 }),
    validate,
  ], controller.register);
  router.post('/users/login', [
    body('user.email').isEmail().normalizeEmail(),
    body('user.password').isString().notEmpty(),
    validate,
  ], controller.login);
  router.get('/user', requireAuth(tokens), controller.current);
  router.put('/user', requireAuth(tokens), [
    body('user').isObject(),
    body('user.email').optional().isEmail().normalizeEmail(),
    body('user.username').optional().isString().trim().isLength({ min: 1 }),
    body('user.password').optional().isString().isLength({ min: 8 }),
    body('user.bio').optional({ nullable: true }).isString(),
    body('user.image').optional({ nullable: true }).isURL(),
    validate,
  ], controller.update);
  return router;
}
