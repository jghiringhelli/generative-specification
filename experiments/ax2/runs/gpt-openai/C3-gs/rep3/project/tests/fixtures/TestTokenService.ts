import { UnauthorizedError } from '../../src/errors/AppError';
import { ITokenService } from '../../src/auth/ITokenService';

export class TestTokenService implements ITokenService {
  public sign(userId: string): string {
    return `token-${userId}`;
  }

  public verify(token: string): string {
    if (!token.startsWith('token-')) throw new UnauthorizedError();
    return token.slice('token-'.length);
  }
}
