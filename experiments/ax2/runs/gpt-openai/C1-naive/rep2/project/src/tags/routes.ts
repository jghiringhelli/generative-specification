import { Router } from "express";
import { listTags } from "./service";

export const tagRouter = Router();

tagRouter.get("/tags", async (_request, response, next) => {
  try {
    response.json({ tags: await listTags() });
  } catch (error) {
    next(error);
  }
});
