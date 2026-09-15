import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateCurrentUser
} from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/users', register);
router.post('/users/login', login);
router.get('/user', requireAuth, getCurrentUser);
router.put('/user', requireAuth, updateCurrentUser);

export default router;
