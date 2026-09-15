import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client shared across repositories.
 * Repositories depend on this abstraction; routes never import it directly.
 */
export const prisma = new PrismaClient();
