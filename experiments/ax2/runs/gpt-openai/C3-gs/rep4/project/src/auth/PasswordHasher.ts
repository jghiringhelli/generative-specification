import argon2 from 'argon2';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export class ArgonPasswordHasher implements IPasswordHasher {
  /** Hashes a plaintext password. */
  public hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /** Compares a password to an Argon2 hash. */
  public verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
