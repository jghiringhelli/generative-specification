import { Router } from "express";
import { prisma } from "../prisma";

export const tagsRouter = Router();

tagsRouter.get("/tags", async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    res.json({ tags: tags.map((tag) => tag.name) });
  } catch (error) {
    next(error);
  }
});
