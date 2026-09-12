import { Request, Response } from 'express';
import { TagService } from '../../application/services/TagService';

export class TagController {
  constructor(private tagService: TagService) {}

  getTags = async (req: Request, res: Response) => {
    try {
      const tags = await this.tagService.getAllTags();

      return res.status(200).json({ tags });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}
