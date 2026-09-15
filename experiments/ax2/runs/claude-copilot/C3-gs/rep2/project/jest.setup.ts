import { prisma } from './src/config/prisma';

/**
 * Global test teardown: disconnect the shared Prisma client so Jest can exit
 * cleanly after the suite completes.
 */
afterAll(async () => {
  await prisma.$disconnect();
});
