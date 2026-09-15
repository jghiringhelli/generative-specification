import { Router } from 'express';
import { getTags } from '../controllers/tag.controller';

const router = Router();

router.get('/tags', getTags);

export default router;
