import { prisma } from '../lib/prisma';

export class TagRepository {
  async findAll(): Promise<string[]> {
    const tags = await prisma.tag.findMany({
      where: {
        articles: {
          some: {}
        }
      },
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map((t) => t.name);
  }
}

export const tagRepository = new TagRepository();
