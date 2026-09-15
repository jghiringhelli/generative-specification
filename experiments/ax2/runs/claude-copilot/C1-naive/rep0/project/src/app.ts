import express, { Application } from 'express';
import cors from 'cors';

import usersRoutes from './routes/users.routes';
import profilesRoutes from './routes/profiles.routes';
import articlesRoutes from './routes/articles.routes';
import commentsRoutes from './routes/comments.routes';
import tagsRoutes from './routes/tags.routes';
import { notFound, errorHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', usersRoutes);
  app.use('/api', profilesRoutes);
  app.use('/api', articlesRoutes);
  app.use('/api', commentsRoutes);
  app.use('/api', tagsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
