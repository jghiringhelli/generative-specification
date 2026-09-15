import { Router, Request, Response, NextFunction } from 'express';
import { tagService } from '../services/tag.service';

const router = Router();

/**
 * GET /api/tags - Get list of tags
 */
router.get('/tags', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await tagService.getTags();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
