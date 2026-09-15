import { PrismaClient } from "@prisma/client";

export interface ITagRepository {
  list(): Promise<string[]>;
}

export class TagRepository implements ITagRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async list(): Promise<string[]> {
    const tags = await this.database.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true },
      orderBy: { name: "asc" }
    });
    return tags.map((tag) => tag.name);
  }
}
