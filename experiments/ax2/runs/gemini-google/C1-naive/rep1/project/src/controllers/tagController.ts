import { Request, Response } from 'express';
import prisma from '../prisma';

export async function getTags(req: Request, res: Response): Promise<void> {
  try {
    const tags = await prisma.tag.findMany({
      select: { name: true }
    });

    res.status(200).json({
      tags: tags.map(t => t.name)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}
