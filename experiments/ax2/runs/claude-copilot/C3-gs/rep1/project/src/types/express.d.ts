import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user id, set by the auth middleware when a valid token is present. */
      userId?: number;
    }
  }
}

export {};
