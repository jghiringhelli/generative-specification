import { PrismaClient } from '@prisma/client';

export class TagRepository {
  constructor(private prisma: PrismaClient) {}

  async getAllTags(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    });

    return tags.map(tag => tag.name);
  }
}
