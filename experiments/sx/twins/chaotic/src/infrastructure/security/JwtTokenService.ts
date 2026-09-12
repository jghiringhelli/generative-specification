import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: number;
  email: string;
  username: string;
}

export interface ITokenService {
  generate(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}

/**
 * JWT-backed token service.
 *
 * Tokens are signed with HS256 and, per CONDUIT-090, are intentionally
 * long-lived (no exp claim) because the mobile client cannot refresh silently.
 */
export class JwtTokenService implements ITokenService {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Sign a token payload.
   * @param payload the claims to embed
   * @returns the signed JWT string
   */
  generate(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret);
  }

  /**
   * Verify and decode a token.
   * @param token the raw JWT
   * @returns the decoded payload
   * @throws {jwt.TokenExpiredError} when the token has expired
   */
  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
