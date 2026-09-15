import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;
try {
  prisma = new PrismaClient();
} catch (e) {
  // Prisma client may not be generated during initial test isolation
}

afterAll(async () => {
  if (prisma && typeof prisma.$disconnect === 'function') {
    await prisma.$disconnect().catch(() => {});
  }
});
