/**
 * JWT/HS256 implementation of {@link ITokenService}.
 *
 * Per ADR-0002 `jsonwebtoken` is a CommonJS package consumed via its **default
 * import** under ESM/NodeNext (`import pkg from 'jsonwebtoken'; const { sign } =
 * pkg;`). Named ESM imports from this package break at runtime and are
 * prohibited. The secret and expiry are injected — the adapter never reads the
 * environment itself.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md
 */
import pkg from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../../errors/AppError.js';
import type { ITokenService, TokenPayload } from '../../services/ports/ITokenService.js';

const { sign, verify } = pkg;

export class JwtTokenService implements ITokenService {
  /**
   * @param secret - HS256 signing secret (validated ≥ 32 chars at config load).
   * @param expiresIn - token lifetime, e.g. `"7d"`.
   */
  constructor(
    private readonly secret: Secret,
    private readonly expiresIn: SignOptions['expiresIn'],
  ) {}

  /** @inheritdoc */
  sign(payload: TokenPayload): string {
    const options: SignOptions = {
      algorithm: 'HS256',
      ...(this.expiresIn !== undefined ? { expiresIn: this.expiresIn } : {}),
    };
    return sign({ userId: payload.userId }, this.secret, options);
  }

  /** @inheritdoc */
  verify(token: string): TokenPayload {
    let decoded: unknown;
    try {
      decoded = verify(token, this.secret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
    if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
      throw new UnauthorizedError('Malformed token payload');
    }
    const userId: unknown = decoded.userId;
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new UnauthorizedError('Malformed token payload');
    }
    return { userId };
  }
}
