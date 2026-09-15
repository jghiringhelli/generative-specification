import { NextFunction, Request, Response } from 'express';
import { TagService } from '../services/tag.service';

/**
 * Controller handling tag queries.
 */
export class TagController {
  private readonly tagService: TagService;

  /**
   * Initializes TagController.
   */
  constructor(tagService: TagService = new TagService()) {
    this.tagService = tagService;
  }

  /**
   * Handles GET /api/tags
   */
  getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = await this.tagService.getAllTags();
      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  };
}
