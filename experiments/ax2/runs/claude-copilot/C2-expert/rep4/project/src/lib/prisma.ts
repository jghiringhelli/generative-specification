import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient instance shared across the application.
 */
export const prisma = new PrismaClient();
