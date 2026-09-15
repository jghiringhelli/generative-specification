/**
 * Ambient augmentation of Express's Request with authentication context set by
 * the auth middleware.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
    }
  }
}

export {};
