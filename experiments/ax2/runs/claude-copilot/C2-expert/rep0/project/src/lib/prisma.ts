import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client used by the repository layer for all database access.
 */
export const prisma = new PrismaClient();
