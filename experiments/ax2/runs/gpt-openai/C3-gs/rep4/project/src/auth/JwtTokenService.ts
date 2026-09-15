import jsonwebtoken from 'jsonwebtoken';

type SignOptions = import('jsonwebtoken').SignOptions;
type JwtPayload = import('jsonwebtoken').JwtPayload;

const { sign, verify } = jsonwebtoken;
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

export interface ITokenService {
  create(userId: string): string;
  read(token: string): string | null;
}

export class JwtTokenService implements ITokenService {
  public constructor(private readonly secret: string) {}

  /** Creates a signed token for a user identifier. */
  public create(userId: string): string {
    return sign({ sub: userId }, this.secret, { expiresIn: JWT_EXPIRY });
  }

  /** Reads a user identifier from a valid token. */
  public read(token: string): string | null {
    try {
      const payload = verify(token, this.secret) as JwtPayload;
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
