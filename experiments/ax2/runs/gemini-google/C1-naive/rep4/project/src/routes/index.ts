import { Router } from 'express';
import userRoutes from './users';
import profileRoutes from './profiles';
import articleRoutes from './articles';
import tagRoutes from './tags';

const router = Router();

router.use('/', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/articles', articleRoutes);
router.use('/tags', tagRoutes);

export default router;
