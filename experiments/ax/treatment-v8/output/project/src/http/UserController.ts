/**
 * Thin HTTP adapter for the user/auth endpoints: validate input, delegate to
 * {@link UserService}, present the result. No business logic lives here.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md, docs/use-cases.md
 */
import type { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError.js';
import type { UserService } from '../services/UserService.js';
import { toUserResponse } from './userPresenter.js';
import {
  loginSchema,
  parseOrThrow,
  registerSchema,
  updateUserSchema,
} from './userSchemas.js';

export class UserController {
  constructor(private readonly service: UserService) {}

  /** POST /api/users — register a new user. */
  async register(req: Request, res: Response): Promise<void> {
    const { user } = parseOrThrow(registerSchema, req.body);
    const authenticated = await this.service.register(user);
    res.status(201).json(toUserResponse(authenticated));
  }

  /** POST /api/users/login — exchange credentials for a token. */
  async login(req: Request, res: Response): Promise<void> {
    const { user } = parseOrThrow(loginSchema, req.body);
    const authenticated = await this.service.login(user);
    res.status(200).json(toUserResponse(authenticated));
  }

  /** GET /api/user — the authenticated user's own profile. */
  async getCurrent(req: Request, res: Response): Promise<void> {
    const authenticated = await this.service.getCurrentUser(this.requireUserId(req));
    res.status(200).json(toUserResponse(authenticated));
  }

  /** PUT /api/user — partial update of the authenticated user. */
  async update(req: Request, res: Response): Promise<void> {
    const { user } = parseOrThrow(updateUserSchema, req.body);
    const authenticated = await this.service.updateUser(this.requireUserId(req), user);
    res.status(200).json(toUserResponse(authenticated));
  }

  /** Read the id attached by `authenticate`; defensive guard for type-narrowing. */
  private requireUserId(req: Request): string {
    if (req.userId === undefined) {
      throw new UnauthorizedError();
    }
    return req.userId;
  }
}
