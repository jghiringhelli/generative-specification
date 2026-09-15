import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user id, populated by auth middleware when present. */
      userId?: number;
    }
  }
}

export {};
