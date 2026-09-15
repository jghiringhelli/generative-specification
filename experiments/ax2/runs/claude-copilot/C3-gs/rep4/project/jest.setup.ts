import { prisma } from './src/config/prisma';

/**
 * Global test teardown: disconnect the shared Prisma client so Jest can exit
 * cleanly and no open handles leak between suites.
 */
afterAll(async () => {
  await prisma.$disconnect();
});
