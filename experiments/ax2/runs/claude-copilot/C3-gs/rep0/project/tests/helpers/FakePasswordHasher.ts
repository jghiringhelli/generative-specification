import { PasswordHasher } from '../../src/utils/PasswordHasher';

/**
 * Deterministic fake password hasher for tests. Hashes by prefixing the
 * plaintext; verification compares against that reversible encoding. Never
 * used outside tests.
 */
export class FakePasswordHasher implements PasswordHasher {
  /** @inheritdoc */
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  /** @inheritdoc */
  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
