import { hashPassword, verifyPassword } from '../../utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('returns a hashed password different from plaintext', async () => {
      const plaintext = 'testpassword123';
      const hash = await hashPassword(plaintext);
      
      expect(hash).not.toBe(plaintext);
      expect(hash).toHaveLength(60); // bcrypt hash length
    });

    it('generates different hashes for the same password', async () => {
      const plaintext = 'testpassword123';
      const hash1 = await hashPassword(plaintext);
      const hash2 = await hashPassword(plaintext);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const plaintext = 'testpassword123';
      const hash = await hashPassword(plaintext);
      
      const isValid = await verifyPassword(plaintext, hash);
      expect(isValid).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const plaintext = 'testpassword123';
      const hash = await hashPassword(plaintext);
      
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });
});
