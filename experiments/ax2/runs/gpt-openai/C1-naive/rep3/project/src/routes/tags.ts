import { Router } from 'express';
import { prisma } from '../config/prisma';

export const tagsRouter = Router();

tagsRouter.get('/tags', async (_request, response) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  response.json({ tags: tags.map((tag) => tag.name) });
});
