import { Router } from "express";
import {
  AuthenticatedRequest,
  optionalAuth,
  requireAuth
} from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { commentIdSchema, createCommentSchema } from "./comment.schemas";
import { CommentService } from "./comment.service";

/** Creates article comment routes. */
export function createCommentRouter(service: CommentService, jwtSecret: string): Router {
  const router = Router();

  router.get(
    "/articles/:slug/comments",
    optionalAuth(jwtSecret),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.json({
          comments: await service.list(request.params.slug, request.userId)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/articles/:slug/comments",
    requireAuth(jwtSecret),
    validateBody(createCommentSchema),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        response.status(201).json({
          comment: await service.create(
            request.params.slug,
            request.userId!,
            request.body.comment.body
          )
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/articles/:slug/comments/:id",
    requireAuth(jwtSecret),
    async (request: AuthenticatedRequest, response, next) => {
      const parsedId = commentIdSchema.safeParse(request.params.id);
      if (!parsedId.success) {
        response.status(422).json({ errors: { body: ["Invalid comment id"] } });
        return;
      }
      try {
        await service.delete(request.params.slug, parsedId.data, request.userId!);
        response.sendStatus(204);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
