/**
 * Thin HTTP adapter for the profile endpoints: read the path/identity, delegate
 * to {@link ProfileService}, present the result. No business logic lives here.
 *
 * @gs-links: docs/specs/profiles.md, docs/use-cases.md
 */
import type { Request, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '../errors/AppError.js';
import type { ProfileService } from '../services/ProfileService.js';
import { toProfileResponse } from './profilePresenter.js';

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  /** GET /api/profiles/:username — public; reflects the viewer's follow state. */
  async get(req: Request, res: Response): Promise<void> {
    const profile = await this.service.getProfile(username(req), req.userId);
    res.status(200).json(toProfileResponse(profile));
  }

  /** POST /api/profiles/:username/follow — follow the target (auth required). */
  async follow(req: Request, res: Response): Promise<void> {
    const profile = await this.service.follow(username(req), this.requireUserId(req));
    res.status(200).json(toProfileResponse(profile));
  }

  /** DELETE /api/profiles/:username/follow — unfollow the target (auth required). */
  async unfollow(req: Request, res: Response): Promise<void> {
    const profile = await this.service.unfollow(username(req), this.requireUserId(req));
    res.status(200).json(toProfileResponse(profile));
  }

  /** Read the id attached by `authenticate`; defensive guard for type-narrowing. */
  private requireUserId(req: Request): string {
    if (req.userId === undefined) {
      throw new UnauthorizedError();
    }
    return req.userId;
  }
}

/**
 * Read the `:username` path segment. The route always binds it; this narrows
 * the `string | undefined` index type and is a defensive 404 if it were absent.
 */
function username(req: Request): string {
  const value = req.params.username;
  if (value === undefined) {
    throw new NotFoundError('Profile');
  }
  return value;
}
