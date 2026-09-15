import { Router } from 'express';
import { getTags } from '../controllers/tagController';

const router = Router();

router.get('/', getTags);

export default router;
