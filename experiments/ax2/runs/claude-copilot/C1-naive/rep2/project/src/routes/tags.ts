import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/tags
router.get('/', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    res.json({ tags: tags.map((t) => t.name) });
  } catch (err) {
    next(err);
  }
});

export default router;
