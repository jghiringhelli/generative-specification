import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/tags - Get list of all tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        name: true
      }
    });

    return res.status(200).json({
      tags: tags.map((t) => t.name)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

export default router;
