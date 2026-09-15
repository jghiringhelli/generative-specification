import { PrismaClient } from '@prisma/client';

/**
 * Shared PrismaClient instance (the database connection adapter). A single
 * instance is reused across the process to avoid exhausting the connection pool.
 */
export const prisma = new PrismaClient();
