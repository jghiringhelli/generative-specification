import { Router } from 'express';
import { Container } from '../container';

/**
 * Build the router for the tags endpoint.
 * @param container - Wired application services.
 * @returns An Express router mounted under /api/tags.
 */
export function createTagRouter(container: Container): Router {
  const router = Router();
  const { tagService } = container;

  router.get('/', async (_req, res) => {
    const result = await tagService.list();
    res.status(200).json(result);
  });

  return router;
}
