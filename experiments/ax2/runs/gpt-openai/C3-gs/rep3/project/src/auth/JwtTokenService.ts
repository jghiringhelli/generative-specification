import jsonwebtoken from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import { ITokenService } from './ITokenService';

const { sign, verify } = jsonwebtoken;
type SignOptions = import('jsonwebtoken').SignOptions;
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

interface TokenPayload {
  readonly sub: string;
}

export class JwtTokenService implements ITokenService {
  public constructor(private readonly secret: string) {}

  /** Signs a JWT identifying a user. */
  public sign(userId: string): string {
    return sign({}, this.secret, { subject: userId, expiresIn: JWT_EXPIRY });
  }

  /** Verifies a JWT and returns its user identifier. */
  public verify(token: string): string {
    try {
      const payload = verify(token, this.secret) as TokenPayload;
      if (!payload.sub) {
        throw new UnauthorizedError('Invalid authentication token');
      }
      return payload.sub;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid authentication token');
    }
  }
}
