import { afterAll } from '@jest/globals';
import { prisma } from './src/config/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
