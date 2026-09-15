import { Router } from "express";
import { optionalAuthentication, requireAuthentication } from "../auth/middleware";
import { addComment, deleteComment, listComments } from "./service";

export const commentRouter = Router();

commentRouter.get("/articles/:slug/comments", optionalAuthentication, async (request, response, next) => {
  try {
    response.json({ comments: await listComments(request.params.slug, request.userId) });
  } catch (error) {
    next(error);
  }
});

commentRouter.post("/articles/:slug/comments", requireAuthentication, async (request, response, next) => {
  try {
    const comment = await addComment(request.params.slug, request.body.comment?.body, request.userId!);
    response.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

commentRouter.delete(
  "/articles/:slug/comments/:id",
  requireAuthentication,
  async (request, response, next) => {
    try {
      await deleteComment(request.params.slug, Number(request.params.id), request.userId!);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
