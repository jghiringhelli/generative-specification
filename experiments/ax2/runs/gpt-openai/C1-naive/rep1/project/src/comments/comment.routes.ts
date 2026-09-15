import { Router } from "express";
import { z } from "zod";

import { findArticle } from "../articles/article.repository";
import { ApiError } from "../errors";
import {
  optionalAuthentication,
  requireAuthentication,
} from "../middleware/authentication";
import { prisma } from "../prisma";
import { toCommentResponse } from "./comment.dto";

const router = Router();
const createSchema = z.object({
  comment: z.object({ body: z.string().min(1) }),
});
const authorInclude = {
  author: { include: { followers: { select: { id: true } } } },
} as const;

router.get(
  "/articles/:slug/comments",
  optionalAuthentication,
  async (request, response, next) => {
    try {
      const article = await findArticle(request.params.slug);
      const comments = await prisma.comment.findMany({
        where: { articleId: article.id },
        include: authorInclude,
        orderBy: { createdAt: "asc" },
      });
      response.json({
        comments: comments.map((comment) => toCommentResponse(comment, request.userId)),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/articles/:slug/comments",
  requireAuthentication,
  async (request, response, next) => {
    try {
      const article = await findArticle(request.params.slug);
      const input = createSchema.parse(request.body);
      const comment = await prisma.comment.create({
        data: {
          body: input.comment.body,
          articleId: article.id,
          authorId: request.userId!,
        },
        include: authorInclude,
      });
      response.status(201).json({
        comment: toCommentResponse(comment, request.userId),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/articles/:slug/comments/:id",
  requireAuthentication,
  async (request, response, next) => {
    try {
      const article = await findArticle(request.params.slug);
      const commentId = z.coerce.number().int().positive().parse(request.params.id);
      const comment = await prisma.comment.findFirst({
        where: { id: commentId, articleId: article.id },
      });
      if (!comment) throw new ApiError(404, { comment: ["not found"] });
      if (comment.authorId !== request.userId) {
        throw new ApiError(403, { comment: ["not owned by user"] });
      }
      await prisma.comment.delete({ where: { id: comment.id } });
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
);

export { router as commentRouter };
