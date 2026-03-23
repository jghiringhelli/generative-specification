import { PrismaClient } from '@prisma/client';

/** Singleton Prisma client instance for the application. */
export const prisma = new PrismaClient();
