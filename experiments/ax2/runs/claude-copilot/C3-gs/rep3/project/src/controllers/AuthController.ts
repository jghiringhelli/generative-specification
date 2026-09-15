import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { parseOrThrow } from '../validators/parse';
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
} from '../validators/userSchemas';

/** Thin driving adapter for authentication endpoints. */
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(registerSchema, req.body);
    const result = await this.auth.register(input);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(loginSchema, req.body);
    const result = await this.auth.login(input);
    res.status(200).json(result);
  };

  current = async (req: Request, res: Response): Promise<void> => {
    const result = await this.auth.getCurrentUser(req.userId as number);
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(updateUserSchema, req.body);
    const result = await this.auth.updateUser(req.userId as number, input);
    res.status(200).json(result);
  };
}
