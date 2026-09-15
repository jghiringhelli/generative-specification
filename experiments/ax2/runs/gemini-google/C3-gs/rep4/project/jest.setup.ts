import { prisma } from './src/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
