import { Prisma } from "@prisma/client";

import { ApiError } from "../errors";
import { prisma } from "../prisma";

export const articleInclude = {
  tags: true,
  favoritedBy: { select: { id: true } },
  author: {
    include: { followers: { select: { id: true } } },
  },
} satisfies Prisma.ArticleInclude;

export async function findArticle(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
  if (!article) throw new ApiError(404, { article: ["not found"] });
  return article;
}
