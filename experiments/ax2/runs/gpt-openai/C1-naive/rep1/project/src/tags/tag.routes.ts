import { Router } from "express";

import { prisma } from "../prisma";

const router = Router();

router.get("/tags", async (_request, response, next) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    response.json({ tags: tags.map((tag) => tag.name) });
  } catch (error) {
    next(error);
  }
});

export { router as tagRouter };
