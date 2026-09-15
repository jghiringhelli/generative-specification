import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client instance (single connection pool for the process).
 * Injected into repository adapters via the composition root.
 */
export const prisma = new PrismaClient();
