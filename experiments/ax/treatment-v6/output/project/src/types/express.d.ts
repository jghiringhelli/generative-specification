declare global {
  namespace Express {
    interface Request {
      /** The authenticated user's ID, set by the auth middleware. */
      userId?: number;
    }
  }
}

export {};
