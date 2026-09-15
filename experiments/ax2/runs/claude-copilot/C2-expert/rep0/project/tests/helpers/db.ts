import { prisma } from '../../src/lib/prisma';

/**
 * Deletes all rows from every table so each test starts from a clean state.
 * Order respects foreign-key dependencies.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnects the Prisma client. Call from an `afterAll` hook.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
