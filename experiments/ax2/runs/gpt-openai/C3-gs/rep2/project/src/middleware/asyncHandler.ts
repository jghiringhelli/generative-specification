import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRoute = (request: Request, response: Response, next: NextFunction) => Promise<void>;

/** Converts an asynchronous route into Express error-forwarding middleware. */
export function asyncHandler(route: AsyncRoute): RequestHandler {
  return (request, response, next) => {
    void route(request, response, next).catch(next);
  };
}
