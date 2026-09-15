import { prisma } from '../config/prisma';

export class TagRepository {
  /** Lists tag names currently connected to at least one article. */
  public async list(): Promise<string[]> {
    const tags = await prisma.tag.findMany({
      where: { articles: { some: {} } },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return tags.map(({ name }) => name);
  }
}
