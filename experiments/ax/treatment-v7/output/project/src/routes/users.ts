import { Router } from 'express';
import { z } from 'zod';
import type { UserService } from '../services/UserService';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { zodToValidationError } from '../utils/zodError';

/** Zod schema for POST /api/users (registration). */
const RegisterSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank").email('is invalid'),
    username: z.string().min(1, "can't be blank"),
    password: z.string().min(1, "can't be blank"),
  }),
});

/** Zod schema for POST /api/users/login. */
const LoginSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank"),
    password: z.string().min(1, "can't be blank"),
  }),
});

/** Zod schema for PUT /api/user (partial update — all fields optional). */
const UpdateUserSchema = z.object({
  user: z
    .object({
      email: z.string().min(1, "can't be blank").email('is invalid').optional(),
      username: z.string().min(1, "can't be blank").optional(),
      password: z.string().optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .refine((u) => Object.keys(u).length > 0, { message: 'no fields provided' }),
});


/**
 * Factory that constructs the user router with injected service dependency.
 *
 * Routes:
 *   POST   /users         — register a new user
 *   POST   /users/login   — authenticate with email + password
 *   GET    /user          — get the current authenticated user
 *   PUT    /user          — update the current authenticated user
 *
 * @param userService - Injected user business-logic service
 * @returns Configured Express Router
 */
export function createUserRouter(userService: UserService): Router {
  const router = Router();

  // POST /api/users — register
  router.post(
    '/users',
    asyncHandler(async (req, res) => {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const response = await userService.register(parsed.data.user);
      res.status(201).json({ user: response });
    }),
  );

  // POST /api/users/login — login
  router.post(
    '/users/login',
    asyncHandler(async (req, res) => {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const response = await userService.login(parsed.data.user);
      res.status(200).json({ user: response });
    }),
  );

  // GET /api/user — get current user (auth required)
  router.get(
    '/user',
    requireAuth,
    asyncHandler(async (req, res) => {
      // requireAuth guarantees userId is set; non-null assertion is safe here
      const response = await userService.getCurrentUser(req.userId!);
      res.status(200).json({ user: response });
    }),
  );

  // PUT /api/user — update current user (auth required)
  router.put(
    '/user',
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const response = await userService.updateUser(req.userId!, parsed.data.user);
      res.status(200).json({ user: response });
    }),
  );

  return router;
}
