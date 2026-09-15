import { PasswordHasher, TokenService } from '../../src/auth/ports';
import { UnauthorizedError } from '../../src/errors/AppError';

export class TestPasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return `hash:${password}`;
  }

  public async verify(hash: string, password: string): Promise<boolean> {
    return hash === `hash:${password}`;
  }
}

export class TestTokenService implements TokenService {
  public sign(userId: string): string {
    return `token:${userId}`;
  }

  public verify(token: string): string {
    if (!token.startsWith('token:')) {
      throw new UnauthorizedError('Invalid test token');
    }
    return token.slice('token:'.length);
  }
}
