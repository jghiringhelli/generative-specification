import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import type { ITokenService, TokenPayload } from './ITokenService';

const { sign, verify } = jwt;

export class JwtTokenService implements ITokenService {
  public constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions['expiresIn'],
  ) {}

  /** Signs a user identity as a bounded-lifetime JWT. */
  public sign(payload: TokenPayload): string {
    return sign({ sub: payload.userId }, this.secret, { expiresIn: this.expiresIn });
  }

  /** Verifies a JWT and returns its authenticated user identity. */
  public verify(token: string): TokenPayload {
    try {
      const decoded = verify(token, this.secret);
      if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
        throw new UnauthorizedError('Invalid authentication token');
      }
      return { userId: decoded.sub };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }
}
