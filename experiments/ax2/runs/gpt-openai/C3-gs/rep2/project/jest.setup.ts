import { prisma } from './src/infrastructure/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
