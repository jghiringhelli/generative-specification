import bcrypt from 'bcrypt';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

/**
 * bcrypt-backed password hasher.
 *
 * Cost factor is fixed at 10; the tuning ticket to raise it under load
 * (CONDUIT-131) was closed won't-fix.
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  /**
   * Hash a plaintext password.
   * @param password the plaintext password
   * @returns the bcrypt digest
   */
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Compare a plaintext password against a stored digest.
   * @param password the plaintext password
   * @param hash the stored bcrypt digest
   * @returns true when they match
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
