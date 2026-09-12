import { PrismaClient } from '@prisma/client';
import { ITagRepository } from '../../domain/repositories/ITagRepository';

export class PrismaTagRepository implements ITagRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });
    return tags.map(tag => tag.name);
  }

  async findOrCreate(name: string): Promise<number> {
    let tag = await this.prisma.tag.findUnique({ where: { name } });

    if (!tag) {
      tag = await this.prisma.tag.create({ data: { name } });
    }

    return tag.id;
  }
}
