import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export interface OptionalAuthRequest extends Request {
  userId?: string;
}
