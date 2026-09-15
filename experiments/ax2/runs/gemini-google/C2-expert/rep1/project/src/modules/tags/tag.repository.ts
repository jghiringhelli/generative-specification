import { prisma } from '../../db/prisma';

export interface ITagRepository {
  findAll(): Promise<string[]>;
}

export class TagRepository implements ITagRepository {
  async findAll(): Promise<string[]> {
    const tags = await prisma.tag.findMany({
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
