import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/TagService';

export class TagController {
  private readonly tagService: TagService;

  constructor(tagService: TagService) {
    this.tagService = tagService;
  }

  getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = await this.tagService.getTags();
      res.status(200).json({ tags });
    } catch (err) {
      next(err);
    }
  };
}
