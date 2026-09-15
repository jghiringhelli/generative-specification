import { Router } from 'express';
import userRoutes from './user.routes';
import profileRoutes from './profile.routes';
import articleRoutes from './article.routes';
import commentRoutes from './comment.routes';
import tagRoutes from './tag.routes';

const router = Router();

router.use(userRoutes);
router.use(profileRoutes);
router.use(articleRoutes);
router.use(commentRoutes);
router.use(tagRoutes);

export default router;
