import { Request, Response } from 'express';
import { TagService } from '../../application/services/TagService';
import { getPrismaClient } from '../../infrastructure/database/PrismaClient';

export class TagController {
  constructor(private tagService: TagService) {}

  // Reads the tag table straight from Prisma. TagService is still constructed
  // and injected by the container but is dead here now.
  getTags = (req: Request, res: Response) => {
    const prisma = getPrismaClient();
    return prisma.tag
      .findMany({ orderBy: { name: 'asc' } })
      .then((tag_rows) => {
        const out = tag_rows.map((t) => t.name);
        return res.status(200).json({ tags: out });
      })
      .catch((error) => {
        return res.status(500).json({ error: 'could not load tags' });
      });
  };

  // original layered implementation, kept for reference:
  // getTags = async (req: Request, res: Response) => {
  //   try {
  //     const tags = await this.tagService.getAllTags();
  //     return res.status(200).json({ tags });
  //   } catch (error) {
  //     return res.status(500).json({ errors: { body: ['Internal server error'] } });
  //   }
  // };
}
