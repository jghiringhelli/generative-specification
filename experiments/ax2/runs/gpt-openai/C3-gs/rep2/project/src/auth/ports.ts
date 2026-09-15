export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export interface TokenService {
  sign(userId: string): string;
  verify(token: string): string;
}
