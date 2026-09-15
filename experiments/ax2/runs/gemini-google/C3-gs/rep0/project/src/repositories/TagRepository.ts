// src/repositories/TagRepository.ts
import { PrismaClient } from '@prisma/client';
import { ITagRepository } from './ITagRepository';
import { prisma as defaultPrisma } from '../prisma';

export class TagRepository implements ITagRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  async findAll(): Promise<string[]>{
    const tags = await this.prisma.tag.findMany({
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

    return tags.map(t => t.name);
  }
}
