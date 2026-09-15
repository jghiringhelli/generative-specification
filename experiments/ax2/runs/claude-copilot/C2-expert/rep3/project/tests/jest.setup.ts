process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.PORT = process.env.PORT ?? '3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/conduit_test?schema=public';
