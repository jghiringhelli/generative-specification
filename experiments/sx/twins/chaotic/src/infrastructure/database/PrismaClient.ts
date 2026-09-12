import { PrismaClient as PrismaClientType } from '@prisma/client';

/*
 * Lazily-constructed singleton Prisma client.
 * Reused across repositories and the direct-Prisma read paths in the
 * controllers. Do not new-up PrismaClient elsewhere (connection-pool churn,
 * see CONDUIT-260).
 */
let prismaInstance: PrismaClientType | null = null;

// TODO: wire graceful $disconnect on SIGTERM
export const getPrismaClient = (): PrismaClientType => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClientType();
  }
  return prismaInstance;
};
