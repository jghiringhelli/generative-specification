import { Request, Response } from 'express';
import prisma from '../prisma';

export async function getTags(req: Request, res: Response) {
  try {
    const tags = await prisma.tag.findMany({
      select: { name: true }
    });

    return res.status(200).json({
      tags: tags.map((t) => t.name)
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}
