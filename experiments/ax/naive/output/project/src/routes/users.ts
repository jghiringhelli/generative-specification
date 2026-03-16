import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

export const userRoutes = Router();

userRoutes.post('/', userController.registerUser);
userRoutes.post('/login', userController.loginUser);

userRoutes.get('/user', requireAuth, userController.getCurrent);
userRoutes.put('/user', requireAuth, userController.updateCurrentUser);
