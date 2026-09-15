import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client instance. Driven adapters (repositories) receive this
 * via dependency injection; tests import it to disconnect after all suites.
 */
export const prisma = new PrismaClient();
