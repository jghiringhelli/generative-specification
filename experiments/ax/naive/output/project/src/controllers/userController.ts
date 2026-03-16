import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const registerSchema = z.object({
  user: z.object({
    email: z.string().email(),
    username: z.string().min(1),
    password: z.string().min(1)
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    bio: z.string().optional(),
    image: z.string().optional()
  })
});

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await authService.register(body.user);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const user = await authService.login(body.user);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function getCurrent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.userId!);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateUserSchema.parse(req.body);
    const user = await authService.updateUser(req.userId!, body.user);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}
