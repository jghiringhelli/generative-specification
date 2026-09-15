import express, { Application } from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import profilesRouter from './routes/profiles';
import articlesRouter from './routes/articles';
import commentsRouter from './routes/comments';
import tagsRouter from './routes/tags';
import { errorHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', usersRouter);
  app.use('/api/profiles', profilesRouter);
  app.use('/api/articles', articlesRouter);
  app.use('/api/articles', commentsRouter);
  app.use('/api/tags', tagsRouter);

  app.use((_req, res) => {
    res.status(404).json({ errors: { body: ['Not found'] } });
  });

  app.use(errorHandler);

  return app;
}
