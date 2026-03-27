import { PrismaClient } from '@prisma/client';

/**
 * Global test teardown: disconnect the Prisma client after all tests in the suite complete.
 * This prevents Jest from hanging due to an open database connection pool.
 *
 * Registered via `setupFilesAfterFramework` in jest.config.js so that Jest globals
 * (afterAll) are available when this file executes.
 */
const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});
