import 'express-async-errors';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';

import usersRouter from './routes/users';
import profilesRouter from './routes/profiles';
import articlesRouter from './routes/articles';
import commentsRouter from './routes/comments';
import tagsRouter from './routes/tags';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', usersRouter);
  app.use('/api', profilesRouter);
  app.use('/api', articlesRouter);
  app.use('/api', commentsRouter);
  app.use('/api', tagsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ errors: { body: ['Not Found'] } });
  });

  app.use(errorHandler);

  return app;
}

export default createApp;
