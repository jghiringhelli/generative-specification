import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/tags - Get list of all tags
router.get('/tags', async (_req: Request, res: Response): Promise<void> => {
  const tags = await prisma.tag.findMany({
    select: { name: true },
  });

  res.status(200).json({
    tags: tags.map((t) => t.name),
  });
});

export default router;
