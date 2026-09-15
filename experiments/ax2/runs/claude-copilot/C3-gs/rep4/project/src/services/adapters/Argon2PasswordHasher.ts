import * as argon2 from 'argon2';
import { IPasswordHasher } from '../ports/IPasswordHasher';

/**
 * argon2id-backed adapter for {@link IPasswordHasher}.
 */
export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
