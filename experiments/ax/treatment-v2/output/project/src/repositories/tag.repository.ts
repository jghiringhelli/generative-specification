import { PrismaClient } from '@prisma/client';

export class TagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get all unique tag names
   * Returns tags ordered alphabetically
   */
  async findAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tags.map((tag) => tag.name);
  }
}
