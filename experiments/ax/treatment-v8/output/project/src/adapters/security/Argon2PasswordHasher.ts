/**
 * Argon2id implementation of {@link IPasswordHasher}.
 *
 * Argon2id is memory-hard and embeds its cost parameters in the hash, so cost
 * can be raised over time without a schema change (ADR-0002). The `argon2`
 * package is CommonJS and is consumed via its default export under our
 * ESM/NodeNext setup.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md
 */
import argon2 from 'argon2';
import type { IPasswordHasher } from '../../services/ports/IPasswordHasher.js';

export class Argon2PasswordHasher implements IPasswordHasher {
  /** @inheritdoc */
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  /** @inheritdoc */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // A malformed or non-Argon2 hash is a verification failure, not a crash.
      return false;
    }
  }
}
