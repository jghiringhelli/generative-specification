import { Router, type Response } from 'express';
import { TagRepository } from './repository';
import { TagService } from './service';

const router = Router();
const service = new TagService(new TagRepository());

router.get('/tags', async (_request, response: Response) => {
  try {
    response.json(await service.list());
  } catch {
    response.status(422).json({ errors: { body: ['Unable to list tags'] } });
  }
});

export { router as tagRouter };
