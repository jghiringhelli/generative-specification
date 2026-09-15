import { Router } from 'express';
import { getTags } from '../controllers/tagController';

const router = Router();

// /api/tags
router.get('/tags', getTags);

export default router;
