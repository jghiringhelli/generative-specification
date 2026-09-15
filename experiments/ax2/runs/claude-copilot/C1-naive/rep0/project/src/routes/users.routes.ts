import { Router } from 'express';
import { register, login, getCurrentUser, updateCurrentUser } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

function asyncHandler(fn: (req: any, res: any, next: any) => Promise<void>) {
  return (req: any, res: any, next: any) => fn(req, res, next).catch(next);
}

// POST /api/users — register
router.post('/users', asyncHandler(register));
// POST /api/users/login — log in
router.post('/users/login', asyncHandler(login));
// GET /api/user — get current user
router.get('/user', requireAuth, asyncHandler(getCurrentUser));
// PUT /api/user — update current user
router.put('/user', requireAuth, asyncHandler(updateCurrentUser));

export default router;
