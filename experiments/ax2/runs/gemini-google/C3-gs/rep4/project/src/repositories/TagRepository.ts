import { ITagRepository } from './ITagRepository';
import { prisma } from '../prisma';

export class TagRepository implements ITagRepository {
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
