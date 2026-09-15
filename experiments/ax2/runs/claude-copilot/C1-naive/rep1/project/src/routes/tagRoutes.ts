import { Router } from 'express';
import { getTags } from '../controllers/tagController';

const router = Router();

router.get('/tags', getTags);

export default router;
