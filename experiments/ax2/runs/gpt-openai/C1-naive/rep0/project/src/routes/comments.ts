import { Comment, User } from "@prisma/client";
import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../auth";
import { prisma } from "../prisma";
import { serializeProfile } from "../serializers";

export const commentsRouter = Router();

type CommentWithAuthor = Comment & { author: User };

async function serializeComment(comment: CommentWithAuthor, userId?: number) {
  const following = userId
    ? Boolean(
        await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: comment.authorId,
            },
          },
        }),
      )
    : false;

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: serializeProfile(comment.author, following),
  };
}

commentsRouter.get("/articles/:slug/comments", optionalAuthenticate, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    const comments = await prisma.comment.findMany({
      where: { articleId: article.id },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({
      comments: await Promise.all(comments.map((comment) => serializeComment(comment, req.userId))),
    });
  } catch (error) {
    next(error);
  }
});

commentsRouter.post("/articles/:slug/comments", authenticate, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    const body = req.body.comment?.body;
    if (!article) {
      res.status(404).json({ errors: { body: ["Article not found"] } });
      return;
    }
    if (!body) {
      res.status(422).json({ errors: { body: ["body is required"] } });
      return;
    }
    const comment = await prisma.comment.create({
      data: { body, articleId: article.id, authorId: req.userId! },
      include: { author: true },
    });
    res.status(201).json({ comment: await serializeComment(comment, req.userId) });
  } catch (error) {
    next(error);
  }
});

commentsRouter.delete(
  "/articles/:slug/comments/:id",
  authenticate,
  async (req, res, next) => {
    try {
      const comment = await prisma.comment.findFirst({
        where: { id: Number(req.params.id), article: { slug: req.params.slug } },
      });
      if (!comment) {
        res.status(404).json({ errors: { body: ["Comment not found"] } });
        return;
      }
      if (comment.authorId !== req.userId) {
        res.status(403).json({ errors: { body: ["Forbidden"] } });
        return;
      }
      await prisma.comment.delete({ where: { id: comment.id } });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
);
