import { UserEntity } from '../domain/types';

/**
 * Express Request augmentation: authenticated identity attached by the auth
 * middleware. `user` is present only after {@link requireAuth}.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserEntity;
      userId?: number;
    }
  }
}

export {};
