import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthPayload } from '../types';

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '60d' });
};

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthPayload;
  } catch (err) {
    return null;
  }
};
