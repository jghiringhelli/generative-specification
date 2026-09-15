import { hashPassword, verifyPassword } from '../../src/utils/password.util';

describe('Password Utilities', () => {
  it('hashes password and produces a bcrypt hash string', async () => {
    const raw = 'my-secret-password-123';
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(raw);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies correct password returns true', async () => {
    const raw = 'secure-password';
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword(raw, hash);

    expect(isValid).toBe(true);
  });

  it('rejects incorrect password returning false', async () => {
    const raw = 'secure-password';
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword('wrong-password', hash);

    expect(isValid).toBe(false);
  });
});
