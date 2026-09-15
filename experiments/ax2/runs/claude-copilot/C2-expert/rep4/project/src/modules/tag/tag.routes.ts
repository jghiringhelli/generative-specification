import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { ArticleRepository } from "../article/article.repository";
import { TagService } from "./tag.service";

/**
 * Build the tag router.
 * @param service Injected tag service.
 * @returns An Express router for tag endpoints.
 */
export function createTagRouter(service: TagService): Router {
  const router = Router();

  router.get(
    "/tags",
    asyncHandler(async (_req, res) => {
      res.status(200).json(await service.list());
    }),
  );

  return router;
}

/** Default composition helper wiring the repository into the service. */
export function buildTagModule(): TagService {
  return new TagService(new ArticleRepository());
}
