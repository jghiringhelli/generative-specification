import { prisma } from "../database";

/** Returns every article tag in alphabetical order. */
export async function listTags(): Promise<string[]> {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" }, select: { name: true } });
  return tags.map((tag) => tag.name);
}
