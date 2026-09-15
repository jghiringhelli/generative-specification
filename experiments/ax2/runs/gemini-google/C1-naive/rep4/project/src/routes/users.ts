import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser
} from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// /api/users
router.post('/users', registerUser);
router.post('/users/login', loginUser);

// /api/user
router.get('/user', requireAuth, getCurrentUser);
router.put('/user', requireAuth, updateCurrentUser);

export default router;
