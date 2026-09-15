import { Router } from 'express';
import { getTags } from '../controllers/tags.controller';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

// GET /api/tags — get list of all tags
router.get('/tags', asyncHandler(getTags));

export default router;
