import { Router } from "express";
import {
  AuthenticatedRequest,
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from "../middleware/auth";
import { CommentService } from "./comment.service";
import { commentIdSchema, createCommentSchema } from "./comment.schemas";

/** Creates article comment routes. */
export function createCommentRouter(service: CommentService, jwtSecret: string): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(jwtSecret);
  const optionalAuthenticate = createOptionalAuthMiddleware(jwtSecret);

  router.get("/articles/:slug/comments", optionalAuthenticate, async (request, response, next) => {
    try {
      const userId = (request as Partial<AuthenticatedRequest>).userId;
      response.json({ comments: await service.list(request.params.slug, userId) });
    } catch (error) { next(error); }
  });

  router.post("/articles/:slug/comments", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      const { body } = createCommentSchema.parse(request.body).comment;
      response.status(201).json({ comment: await service.create(request.params.slug, body, userId) });
    } catch (error) { next(error); }
  });

  router.delete("/articles/:slug/comments/:id", authenticate, async (request, response, next) => {
    try {
      const userId = (request as AuthenticatedRequest).userId;
      await service.delete(request.params.slug, commentIdSchema.parse(request.params.id), userId);
      response.sendStatus(204);
    } catch (error) { next(error); }
  });

  return router;
}
