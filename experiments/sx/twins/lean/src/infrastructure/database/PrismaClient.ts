import { PrismaClient as PrismaClientType } from '@prisma/client';

let prismaInstance: PrismaClientType | null = null;

export const getPrismaClient = (): PrismaClientType => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClientType();
  }
  return prismaInstance;
};
