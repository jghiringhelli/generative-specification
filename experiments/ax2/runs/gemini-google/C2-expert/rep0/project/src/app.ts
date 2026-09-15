import express, { Application } from 'express';
import { createApiRouter } from './routes';
import { errorHandler } from './middleware/error.middleware';

/**
 * Creates and configures the Express application.
 *
 * @returns {Application} Configured Express application instance
 */
export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use('/api', createApiRouter());
  app.use(errorHandler);

  return app;
}

export const app = createApp();
