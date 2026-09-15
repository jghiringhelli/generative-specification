import type { NextFunction, Request, Response } from 'express';
import type { TagService } from '../services/TagService';

export class TagController {
  public constructor(private readonly tags: TagService) {}

  /** Returns every tag used by at least one article. */
  public list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json({ tags: await this.tags.list() });
    } catch (error) {
      next(error);
    }
  };
}
