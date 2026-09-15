import { Router } from "express";
import { AuthenticatedRequest, optionalAuth, requireAuth } from "../middleware/auth";
import { createCommentSchema } from "./comment.schemas";
import { CommentService } from "./comment.service";

export function createCommentRouter(service: CommentService, jwtSecret: string): Router {
  const router = Router();

  router.get("/:slug/comments", optionalAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json({ comments: await service.list(request.params.slug, request.userId) });
    } catch (error) { next(error); }
  });

  router.post("/:slug/comments", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      const { body } = createCommentSchema.parse(request.body).comment;
      response.status(201).json({ comment: await service.create(request.params.slug, request.userId!, body) });
    } catch (error) { next(error); }
  });

  router.delete("/:slug/comments/:id", requireAuth(jwtSecret), async (request: AuthenticatedRequest, response, next) => {
    try {
      await service.delete(request.params.slug, Number(request.params.id), request.userId!);
      response.sendStatus(204);
    } catch (error) { next(error); }
  });

  return router;
}
