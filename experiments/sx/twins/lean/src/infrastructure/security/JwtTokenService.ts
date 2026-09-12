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

export class JwtTokenService implements ITokenService {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'your-secret-key';
  }

  generate(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret);
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
