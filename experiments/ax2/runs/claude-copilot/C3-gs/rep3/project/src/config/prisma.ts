import { PrismaClient } from '@prisma/client';

/**
 * Single shared PrismaClient instance (composition-root singleton for I/O).
 */
export const prisma = new PrismaClient();
