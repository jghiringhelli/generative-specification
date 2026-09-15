import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import profilesRouter from './routes/profiles';
import articlesRouter from './routes/articles';
import commentsRouter from './routes/comments';
import tagsRouter from './routes/tags';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', usersRouter);
  app.use('/api', profilesRouter);
  app.use('/api/articles', articlesRouter);
  app.use('/api', commentsRouter);
  app.use('/api', tagsRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ errors: { body: ['not found'] } });
  });

  // error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ errors: { body: [err.message || 'internal server error'] } });
  });

  return app;
}
