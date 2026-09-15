import { prisma } from './src/config/prisma';

/**
 * Global test teardown: disconnect the shared Prisma client so Jest can exit
 * cleanly without open handles.
 */
afterAll(async () => {
  await prisma.$disconnect();
});
