import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/TagService';

export class TagController {
  private readonly tagService: TagService;

  constructor(tagService: TagService) {
    this.tagService = tagService;
  }

  /**
   * Retrieves all unique tags that appear on any article.
   * Route: GET /api/tags
   */
  public getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.tagService.getTags();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
