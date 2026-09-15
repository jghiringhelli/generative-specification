import { IPasswordHasher } from '../../src/auth/IPasswordHasher';

export class TestPasswordHasher implements IPasswordHasher {
  public hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  public verify(hash: string, password: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${password}`);
  }
}
