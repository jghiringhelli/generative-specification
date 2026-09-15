import pkg, { SignOptions } from 'jsonwebtoken';
import { ITokenService } from '../ports/ITokenService';
import { UnauthorizedError } from '../../errors/AppError';

const { sign } = pkg;
const { verify } = pkg;

/**
 * JWT-backed adapter for {@link ITokenService}. Uses the ESM-safe default-import
 * pattern for `jsonwebtoken` and casts the expiry per the known type pitfall.
 */
export class JwtTokenService implements ITokenService {
  private readonly expiry: SignOptions['expiresIn'];

  constructor(
    private readonly secret: string,
    expiry: string,
  ) {
    this.expiry = (expiry ?? '7d') as SignOptions['expiresIn'];
  }

  sign(userId: string): string {
    return sign({ sub: userId }, this.secret, { expiresIn: this.expiry });
  }

  verify(token: string): string {
    try {
      const payload = verify(token, this.secret);
      if (typeof payload === 'string' || typeof payload.sub !== 'string') {
        throw new UnauthorizedError('invalid token');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedError('invalid token');
    }
  }
}
