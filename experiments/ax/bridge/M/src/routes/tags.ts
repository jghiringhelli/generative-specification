import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tags - Get all tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });

    const tagNames = tags.map((tag) => tag.name);

    return res.status(200).json({ tags: tagNames });
  } catch (error) {
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

export default router;
