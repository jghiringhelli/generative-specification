
/**
 * Server entry point.
 * Initializes Prisma, creates Express app, starts HTTP server.
 */

import { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { createApp } from './app';
import pino from 'pino';

const logger = pino({ level: env.LOG_LEVEL });
const prisma = new PrismaClient();

const app = createApp(prisma);

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});
