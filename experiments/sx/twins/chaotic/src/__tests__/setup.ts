import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean database before tests
  await prisma.$executeRaw`TRUNCATE TABLE "Comment" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Favorite" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ArticleTag" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Article" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Tag" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Follow" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
