import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();
const commentSchema = z.object({ body: z.string().min(1) });

const includeAuthor = (viewerId?: number) =>
  ({
    author: {
      include: {
        followers: viewerId ? { where: { followerId: viewerId } } : false,
      },
    },
  }) satisfies Prisma.CommentInclude;

type CommentResult = Prisma.CommentGetPayload<{
  include: { author: { include: { followers: true } } };
}>;

function serializeComment(comment: CommentResult) {
  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: Boolean(comment.author.followers?.length),
    },
  };
}

async function findArticleId(slug: string): Promise<number> {
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!article) throw new ApiError(404, "article not found");
  return article.id;
}

router.get("/articles/:slug/comments", optionalAuth, async (request, response, next) => {
  try {
    const articleId = await findArticleId(request.params.slug);
    const comments = await prisma.comment.findMany({
      where: { articleId },
      include: includeAuthor(request.userId),
      orderBy: { createdAt: "asc" },
    });
    response.json({
      comments: (comments as CommentResult[]).map(serializeComment),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/articles/:slug/comments", requireAuth, async (request, response, next) => {
  try {
    const input = commentSchema.parse(request.body?.comment);
    const articleId = await findArticleId(request.params.slug);
    const comment = await prisma.comment.create({
      data: { body: input.body, articleId, authorId: request.userId! },
      include: includeAuthor(request.userId),
    });
    response.status(201).json({ comment: serializeComment(comment as CommentResult) });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/articles/:slug/comments/:id",
  requireAuth,
  async (request, response, next) => {
    try {
      const articleId = await findArticleId(request.params.slug);
      const comment = await prisma.comment.findFirst({
        where: { id: Number(request.params.id), articleId },
      });
      if (!comment) throw new ApiError(404, "comment not found");
      if (comment.authorId !== request.userId) {
        throw new ApiError(403, "not the comment author");
      }
      await prisma.comment.delete({ where: { id: comment.id } });
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
