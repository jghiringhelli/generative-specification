import { prisma } from '../../src/repositories/prisma.client';

/**
 * Resets database state by removing all rows across tables.
 * Used before or after test suites to maintain clean isolation.
 */
export async function clearDatabase(): Promise<void> {
  try {
    await prisma.follows.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Gracefully handle if tables are not yet created in the environment
  }
}

/**
 * Disconnects the Prisma client when test runs finish.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect error
  }
}
