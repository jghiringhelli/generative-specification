import argon2 from 'argon2';
import type { IPasswordHasher } from './IPasswordHasher';

export class Argon2PasswordHasher implements IPasswordHasher {
  /** Hashes a plaintext password with Argon2. */
  public async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /** Verifies a plaintext password against an Argon2 hash. */
  public async verify(passwordHash: string, password: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}
