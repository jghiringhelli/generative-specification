
/**
 * Global Jest setup.
 * Runs once before all test suites.
 */

import { PrismaClient } from '@prisma/client';

// Ensure test environment is set
if (process.env.NODE_ENV !== 'test') {
  console.warn('Warning: NODE_ENV is not set to "test". Setting it now.');
  process.env.NODE_ENV = 'test';
}

// Ensure DATABASE_URL is set for tests
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Tests require a test database.'
  );
}

// Global Prisma client for test cleanup
const prisma = new PrismaClient();

// Disconnect Prisma after all tests complete
afterAll(async () => {
  await prisma.$disconnect();
});

// Export for use in individual test files if needed
export { prisma };
