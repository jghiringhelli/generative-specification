import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getTags(_req: AuthRequest, res: Response): Promise<void> {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  res.json({ tags: tags.map((t) => t.name) });
}
