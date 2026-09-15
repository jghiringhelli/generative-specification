import { PrismaClient } from '@prisma/client';

export interface TagRepositoryPort {
  list(): Promise<ReadonlyArray<string>>;
}

export class TagRepository implements TagRepositoryPort {
  public constructor(private readonly database: PrismaClient) {}

  public async list(): Promise<ReadonlyArray<string>> {
    const tags = await this.database.tag.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
    return tags.map(({ name }) => name);
  }
}
