import { Request, Response } from 'express';
import { TagService } from '../services/TagService';

/** Thin driving adapter for the tag endpoint. */
export class TagController {
  constructor(private readonly tags: TagService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.tags.list();
    res.status(200).json(result);
  };
}
