// src/controllers/TagController.ts
import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/TagService';

export class TagController {
  constructor(private readonly tagService: TagService) {}

  public getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = await this.tagService.getTags();
      res.status(200).json({ tags });
    } catch (err) {
      next(err);
    }
  };
}
