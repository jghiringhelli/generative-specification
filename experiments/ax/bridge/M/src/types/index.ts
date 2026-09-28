import { Request } from 'express';

export interface UserPayload {
  id: number;
  email: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface UserResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}
