import { Router } from 'express';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
} from './user.validation';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export const usersRouter = Router();
export const userRouter = Router();

usersRouter.post(
  '/users',
  asyncHandler(async (req, res) => {
    const { user } = registerSchema.parse(req.body);
    const result = await userService.register(user);
    res.status(201).json(result);
  }),
);

usersRouter.post(
  '/users/login',
  asyncHandler(async (req, res) => {
    const { user } = loginSchema.parse(req.body);
    const result = await userService.login(user);
    res.status(200).json(result);
  }),
);

userRouter.get(
  '/user',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await userService.getCurrentUser(req.user!.id);
    res.status(200).json(result);
  }),
);

userRouter.put(
  '/user',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { user } = updateUserSchema.parse(req.body);
    const result = await userService.updateUser(req.user!.id, user);
    res.status(200).json(result);
  }),
);
