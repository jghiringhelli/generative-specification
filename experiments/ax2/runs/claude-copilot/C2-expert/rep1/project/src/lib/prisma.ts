import { PrismaClient } from '@prisma/client';

/**
 * Single shared PrismaClient instance (composition root wiring).
 * Repositories receive this instance via constructor injection.
 */
export const prisma = new PrismaClient();
