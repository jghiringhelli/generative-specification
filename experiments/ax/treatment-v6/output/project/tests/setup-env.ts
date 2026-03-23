// Sets required environment variables before any module imports env.ts
// This file runs in the Jest worker process before any test modules are loaded.
process.env['DATABASE_URL'] = 'postgresql://conduit:conduit@localhost:5432/conduit_test';
process.env['JWT_SECRET'] = 'test-secret-that-is-at-least-32-chars-long';
process.env['JWT_EXPIRY'] = '7d';
process.env['NODE_ENV'] = 'test';
