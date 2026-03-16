import { BCRYPT_ROUNDS, JWT_EXPIRY_DAYS, JWT_EXPIRY_SECONDS } from '../../constants/auth';

describe('Auth Constants', () => {
  it('has correct bcrypt rounds', () => {
    expect(BCRYPT_ROUNDS).toBe(12);
  });

  it('has correct JWT expiry in days', () => {
    expect(JWT_EXPIRY_DAYS).toBe(30);
  });

  it('calculates JWT expiry in seconds correctly', () => {
    const expectedSeconds = 30 * 24 * 60 * 60; // 30 days in seconds
    expect(JWT_EXPIRY_SECONDS).toBe(expectedSeconds);
    expect(JWT_EXPIRY_SECONDS).toBe(2592000);
  });
});
