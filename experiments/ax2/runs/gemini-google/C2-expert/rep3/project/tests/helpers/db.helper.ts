import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../src/repositories/prisma.client';

/**
 * Resets database tables for integration test isolation.
 *
 * @param {PrismaClient} [prisma] Optional Prisma client instance
 */
export async function clearDatabase(prisma: PrismaClient = getPrismaClient()): Promise<void> {
  await prisma.comment.deleteMany({});
  await prisma.articleFavorite.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.follows.deleteMany({});
  await prisma.user.deleteMany({});
}
