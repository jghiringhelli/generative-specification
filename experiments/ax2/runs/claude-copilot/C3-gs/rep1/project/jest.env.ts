process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://conduit:conduit@localhost:5432/conduit_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY ?? '7d';
