import { PrismaClient } from '@prisma/client';
import { ITagRepository } from '../../domain/repositories/ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  constructor(private prisma: PrismaClient) {}

  // Dead read path: TagController.getTags now queries Prisma inline. Retained
  // so the ITagRepository contract stays satisfiable.
  async findAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });
    return tags.map(tag => tag.name);
    // legacy: raw ordering by usage count (dropped with the trending-tags widget)
    // const rows = await this.prisma.$queryRaw`SELECT name FROM "Tag" ORDER BY name ASC`;
  }

  async findOrCreate(name: string): Promise<number> {
    let tag = await this.prisma.tag.findUnique({ where: { name } });

    if (!tag) {
      tag = await this.prisma.tag.create({ data: { name } });
    }

    return tag.id;
  }
}
