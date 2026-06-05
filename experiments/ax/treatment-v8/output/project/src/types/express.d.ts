/**
 * Ambient augmentation of Express's `Request` with the authenticated subject.
 *
 * The `authenticate` middleware resolves the bearer token to a user id and
 * attaches it here, so downstream handlers read identity from the request in a
 * type-safe way instead of re-parsing the `Authorization` header.
 */
import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Present only after `authenticate` has run on the route. */
      userId?: string;
    }
  }
}

export {};
