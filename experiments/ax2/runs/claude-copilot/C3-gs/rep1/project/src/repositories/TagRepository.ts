import { prisma } from '../config/prisma';
import { ITagRepository } from './ITagRepository';

/**
 * Prisma-backed implementation of the tag persistence port.
 */
export class TagRepository implements ITagRepository {
  /** @inheritdoc */
  async findAll(): Promise<string[]> {
    const tags = await prisma.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return tags.map((tag) => tag.name);
  }

  /** @inheritdoc */
  async ensure(names: string[]): Promise<void> {
    for (const name of names) {
      await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  }
}
