import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  register,
  login,
  getCurrentUser,
  updateUser,
} from '../controllers/userController';

const router = Router();

router.post('/users', register);
router.post('/users/login', login);
router.get('/user', requireAuth, getCurrentUser);
router.put('/user', requireAuth, updateUser);

export default router;
