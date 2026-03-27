/**
 * Test environment variables — loaded via `setupFiles` before any module is imported.
 *
 * These values are set before module-level constants (e.g. JWT_SECRET in UserService)
 * are evaluated. Do NOT move this logic to setupFilesAfterFramework — the test framework
 * initialises modules first, making env vars set there arrive too late.
 *
 * Values are intentionally weak (short secret, fast expiry) — for tests only.
 */
process.env.JWT_SECRET = 'test-secret-for-jest-testing-only-32ch';
process.env.JWT_EXPIRY = '1h';
process.env.NODE_ENV = 'test';
