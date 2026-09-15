import { Router } from "express";
import { TagService } from "./tag.service";

/** Creates the tag-list route. */
export function createTagRouter(service: TagService): Router {
  const router = Router();

  router.get("/tags", async (_request, response, next) => {
    try {
      response.json({ tags: await service.list() });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
