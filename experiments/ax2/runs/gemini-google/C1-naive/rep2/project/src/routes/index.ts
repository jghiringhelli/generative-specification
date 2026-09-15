import { Router } from 'express';
import usersRouter from './users';
import profilesRouter from './profiles';
import articlesRouter from './articles';
import commentsRouter from './comments';
import tagsRouter from './tags';

const router = Router();

router.use(usersRouter);
router.use(profilesRouter);
router.use(articlesRouter);
router.use(commentsRouter);
router.use(tagsRouter);

export default router;
