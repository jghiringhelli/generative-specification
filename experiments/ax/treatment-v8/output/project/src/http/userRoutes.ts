/**
 * Router for the user/auth endpoints. Wires URLs to {@link UserController},
 * applying `authenticate` only to the routes that require a session. The
 * controller and middleware are constructed from injected dependencies, so the
 * same router runs against the Prisma adapter in production and the in-memory
 * fake in tests.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md
 */
import { Router } from 'express';
import type { ITokenService } from '../services/ports/ITokenService.js';
import type { UserService } from '../services/UserService.js';
import { UserController } from './UserController.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { authenticate } from './middleware/authenticate.js';

/** Dependencies the user router needs to construct its handlers. */
export interface UserRouterDependencies {
  readonly userService: UserService;
  readonly tokenService: ITokenService;
}

/**
 * Build the `/api` user router.
 *
 * @param deps - the user service and token service.
 * @returns a configured Express {@link Router}.
 */
export function createUserRouter(deps: UserRouterDependencies): Router {
  const router = Router();
  const controller = new UserController(deps.userService);
  const requireAuth = authenticate(deps.tokenService);

  router.post('/users', asyncHandler((req, res) => controller.register(req, res)));
  router.post('/users/login', asyncHandler((req, res) => controller.login(req, res)));
  router.get('/user', requireAuth, asyncHandler((req, res) => controller.getCurrent(req, res)));
  router.put('/user', requireAuth, asyncHandler((req, res) => controller.update(req, res)));

  return router;
}
