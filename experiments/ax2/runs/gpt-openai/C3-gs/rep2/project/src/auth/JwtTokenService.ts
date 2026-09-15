import jsonwebtoken from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import { TokenService } from './ports';

type SignOptions = import('jsonwebtoken').SignOptions;
const { sign, verify } = jsonwebtoken;
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

interface JwtPayload {
  readonly sub: string;
}

export class JwtTokenService implements TokenService {
  public constructor(private readonly secret: string) {}

  /** Signs a token identifying one user. */
  public sign(userId: string): string {
    return sign({}, this.secret, { subject: userId, expiresIn: JWT_EXPIRY });
  }

  /** Verifies a token and returns its user ID. */
  public verify(token: string): string {
    try {
      const payload = verify(token, this.secret) as JwtPayload;
      if (!payload.sub) {
        throw new UnauthorizedError('Token subject is missing');
      }
      return payload.sub;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
