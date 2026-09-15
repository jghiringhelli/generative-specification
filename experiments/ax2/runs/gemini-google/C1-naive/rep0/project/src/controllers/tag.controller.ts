import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getTags = async (req: Request, res: Response): Promise<void> => {
  const tags = await prisma.tag.findMany({
    select: { name: true },
    orderBy: { name: 'asc' }
  });

  res.status(200).json({
    tags: tags.map((t) => t.name)
  });
};
