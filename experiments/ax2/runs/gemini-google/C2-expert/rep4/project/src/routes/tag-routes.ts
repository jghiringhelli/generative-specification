import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag-service';

const router = Router();
const tagService = new TagService();

/**
 * GET /api/tags - Get list of unique tags
 */
router.get('/tags', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await tagService.getTags();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const tagRouter = router;
