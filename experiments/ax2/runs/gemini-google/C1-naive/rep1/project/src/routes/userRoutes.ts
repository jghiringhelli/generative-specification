import { Router } from 'express';
import { register, login, getCurrentUser, updateUser } from '../controllers/userController';
import { authRequired } from '../middlewares/auth';

const router = Router();

// /api/users
router.post('/users', register);
router.post('/users/login', login);

// /api/user
router.get('/user', authRequired, getCurrentUser);
router.put('/user', authRequired, updateUser);

export default router;
