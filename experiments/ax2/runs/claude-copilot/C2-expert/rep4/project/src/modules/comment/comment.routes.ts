import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ValidationError } from "../../lib/errors";
import { ArticleRepository } from "../article/article.repository";
import { UserRepository } from "../user/user.repository";
import { CommentRepository } from "./comment.repository";
import { CommentService } from "./comment.service";
import { createCommentSchema } from "./comment.schemas";

/**
 * Parse a comment id path param or throw a validation error.
 * @param raw The raw id string.
 * @returns The parsed numeric id.
 */
function parseCommentId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(["comment id must be a positive integer"]);
  }
  return id;
}

/**
 * Build the comment router.
 * @param service Injected comment service.
 * @returns An Express router for comment endpoints.
 */
export function createCommentRouter(service: CommentService): Router {
  const router = Router();

  router.get(
    "/articles/:slug/comments",
    optionalAuth,
    asyncHandler(async (req, res) => {
      res
        .status(200)
        .json(await service.list(req.params.slug, req.user?.id));
    }),
  );

  router.post(
    "/articles/:slug/comments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { comment } = validate(createCommentSchema, req.body);
      res
        .status(201)
        .json(await service.add(req.params.slug, comment.body, req.user!.id));
    }),
  );

  router.delete(
    "/articles/:slug/comments/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const commentId = parseCommentId(req.params.id);
      await service.delete(req.params.slug, commentId, req.user!.id);
      res.status(200).json({});
    }),
  );

  return router;
}

/** Default composition helper wiring repositories into the service. */
export function buildCommentModule(): CommentService {
  return new CommentService(
    new CommentRepository(),
    new ArticleRepository(),
    new UserRepository(),
  );
}
