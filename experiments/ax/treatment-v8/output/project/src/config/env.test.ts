/**
 * Unit specs for environment validation. The app must fail fast and loud on a
 * missing or malformed configuration rather than booting into a broken state.
 */
import { describe, expect, it } from '@jest/globals';
import { loadConfig } from './env.js';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '3008',
  DATABASE_URL: 'postgresql://u:p@localhost:5453/db',
  JWT_SECRET: 'a-sufficiently-long-test-secret-1234567890',
  JWT_EXPIRY: '7d',
};

describe('loadConfig', () => {
  it('parses and coerces a valid environment', () => {
    const config = loadConfig({ ...validEnv });
    expect(config.port).toBe(3008);
    expect(config.databaseUrl).toBe(validEnv.DATABASE_URL);
    expect(config.jwtSecret).toBe(validEnv.JWT_SECRET);
    expect(config.jwtExpiry).toBe('7d');
    expect(config.nodeEnv).toBe('test');
  });

  it('defaults NODE_ENV, PORT, and JWT_EXPIRY when omitted', () => {
    const config = loadConfig({
      DATABASE_URL: validEnv.DATABASE_URL,
      JWT_SECRET: validEnv.JWT_SECRET,
    });
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.jwtExpiry).toBe('7d');
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => loadConfig({ ...validEnv, JWT_SECRET: 'too-short' })).toThrow(/JWT_SECRET/);
  });

  it('rejects a missing DATABASE_URL', () => {
    const incomplete: Record<string, string> = { ...validEnv };
    delete incomplete.DATABASE_URL;
    expect(() => loadConfig(incomplete)).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => loadConfig({ ...validEnv, PORT: 'not-a-number' })).toThrow();
  });

  it('rejects an invalid NODE_ENV', () => {
    expect(() => loadConfig({ ...validEnv, NODE_ENV: 'staging' })).toThrow();
  });
});
