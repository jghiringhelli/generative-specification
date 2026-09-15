export interface TokenPayload {
  readonly userId: string;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
