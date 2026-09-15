import argon2 from 'argon2';
import { PasswordHasher } from './ports';

export class ArgonPasswordHasher implements PasswordHasher {
  /** Hashes a plaintext password with Argon2. */
  public async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /** Verifies a plaintext password against an encoded Argon2 hash. */
  public async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
