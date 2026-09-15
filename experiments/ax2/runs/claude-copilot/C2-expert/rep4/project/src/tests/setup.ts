/**
 * Jest setup: ensure required environment variables exist before any
 * module reads them. A real DATABASE_URL is still required for the
 * integration suites to connect to a Postgres test database.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.PORT = process.env.PORT ?? "3000";
