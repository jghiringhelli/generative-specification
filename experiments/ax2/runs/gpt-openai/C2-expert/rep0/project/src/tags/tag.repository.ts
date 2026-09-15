import { PrismaClient } from "@prisma/client";

export interface TagRepositoryPort {
  list(): Promise<ReadonlyArray<string>>;
}

export class TagRepository implements TagRepositoryPort {
  public constructor(private readonly prisma: PrismaClient) {}

  /** Lists every persisted tag name once in lexical order. */
  public async list(): Promise<ReadonlyArray<string>> {
    const tags = await this.prisma.tag.findMany({
      select: { name: true },
      orderBy: { name: "asc" }
    });
    return tags.map(({ name }) => name);
  }
}
