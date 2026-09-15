import { PrismaClient } from "@prisma/client";

export interface TagRepositoryPort {
  listNames(): Promise<string[]>;
}

export class TagRepository implements TagRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Lists all persisted tag names in alphabetical order. */
  public async listNames(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: { articles: { some: {} } },
      select: { name: true },
      orderBy: { name: "asc" }
    });
    return tags.map((tag) => tag.name);
  }
}
