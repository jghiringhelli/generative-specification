import { AuthUser } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
