import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client instance for the application.
 *
 * Reused across repositories and torn down in the Jest global teardown.
 */
export const prisma = new PrismaClient();
