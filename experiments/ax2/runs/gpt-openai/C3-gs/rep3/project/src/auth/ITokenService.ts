export interface ITokenService {
  sign(userId: string): string;
  verify(token: string): string;
}
