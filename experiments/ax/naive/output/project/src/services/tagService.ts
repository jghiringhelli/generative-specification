import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  return tags.map(tag => tag.name);
}
