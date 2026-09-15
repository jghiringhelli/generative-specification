import { Request, Response } from 'express';
import prisma from '../prisma';

export async function getTags(_req: Request, res: Response) {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  return res.json({ tags: tags.map((t) => t.name) });
}
