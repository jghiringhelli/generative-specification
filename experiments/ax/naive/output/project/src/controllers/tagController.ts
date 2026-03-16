import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tagService';

export async function getTags(req: Request, res: Response, next: NextFunction) {
  try {
    const tags = await tagService.getAllTags();
    res.json({ tags });
  } catch (error) {
    next(error);
  }
}
