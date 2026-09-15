import { Router, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/tags — get list of all tags
router.get('/tags', async (_req, res: Response) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  return res.json({ tags: tags.map((t) => t.name) });
});

export default router;
